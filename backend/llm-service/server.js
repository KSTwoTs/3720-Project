// backend/llm-driven-booking/server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 7001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:6001';

// ---- helpers ---------------------------------------------------------------
const reply = (res, body, code = 200) => res.status(code).json(body);

const normalize = (s = '') => s.trim().toLowerCase();

const strictSchema = (obj) => {
  // very small schema check
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'not an object' };
  const intents = ['show_events', 'propose_booking', 'unknown'];
  if (!intents.includes(obj.intent)) return { ok: false, error: 'bad intent' };
  if (obj.intent === 'propose_booking') {
    if (typeof obj.eventName !== 'string' || !obj.eventName.trim()) return { ok: false, error: 'missing eventName' };
    if (!Number.isInteger(obj.tickets) || obj.tickets < 1) return { ok: false, error: 'bad tickets' };
  }
  return { ok: true };
};

const FallbackSuggestions = ['show events', 'book 2 for <event name>'];

// ---- LLM call (Ollama by default; OpenAI optional) -------------------------
async function callLLM(userText, events = []) {
  const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

  const eventList = events
    .map(e => `- ${e.name} (id ${e.id}) with ${e.available_tickets} available`)
    .join('\n');

  const instruction = `
You are a parser for a ticketing system. Return ONLY a compact JSON object, no prose.
Schema:
{
  "intent": "show_events" | "propose_booking" | "unknown",
  "eventName": string (required if intent=="propose_booking"),
  "tickets": number (required if intent=="propose_booking"),
  "confidence": number (0..1)
}

Rules:
- If user asks to see/browse events, set intent="show_events".
- If user asks to book/reserve, set intent="propose_booking" and extract eventName and tickets (default to 1 if none stated).
- If unsure, intent="unknown".
- Never book; only parse.
Known events:
${eventList || '(no events provided)'}
User: ${userText}
JSON:
`.trim();

  if (provider === 'openai') {
    // OPTIONAL: use when OPENAI_API_KEY is set
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'system', content: instruction }],
      temperature: 0,
    });
    return JSON.parse(r.choices[0].message.content);
  } else {
    // OLLAMA (default)
    const r = await axios.post(
      process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
      {
        model: process.env.OLLAMA_MODEL || 'llama3',
        prompt: instruction,
        stream: false,
        options: { temperature: 0 }
      },
      { timeout: 25_000 }
    );
    // Ollama returns { response: "<model text>" }
    return JSON.parse(r.data.response);
  }
}

// ---- keyword/regex fallback -------------------------------------------------
function keywordFallback(text) {
  const t = normalize(text);
  if (t.includes('show events') || t.includes('list events') || t.includes('browse events')) {
    return { intent: 'show_events', confidence: 0.6 };
  }
  // book <num> (ticket[s]|tix)? for <event name>
  const m = t.match(/book\s+(\d+)\s*(?:tickets?|tix)?\s*(?:for|to)\s+(.+)$/i);
  if (m) {
    return {
      intent: 'propose_booking',
      tickets: parseInt(m[1], 10),
      eventName: m[2].trim(),
      confidence: 0.55
    };
  }
  // book <event name>
  const m2 = t.match(/book\s+(.+)$/i);
  if (m2) {
    return { intent: 'propose_booking', tickets: 1, eventName: m2[1].trim(), confidence: 0.5 };
  }
  return { intent: 'unknown', confidence: 0.3 };
}

// ---- routes ----------------------------------------------------------------

// health
app.get('/health', (req, res) => reply(res, { ok: true, service: 'llm-driven-booking' }));

// Parse ONLY (no booking here)
app.post('/api/llm/parse', async (req, res) => {
  try {
    const message = (req.body && req.body.message) || '';
    if (!message.trim()) return reply(res, { intent: 'unknown', message: 'Empty message', fallbackSuggestions: FallbackSuggestions }, 400);

    // Optional: give LLM the event catalog for better extraction
    const { data: events = [] } = await axios.get(`${CLIENT_URL}/api/events`).catch(() => ({ data: [] }));

    let parsed;
    try {
      parsed = await callLLM(message, events);
    } catch (_) {
      parsed = null;
    }

    if (!parsed || !strictSchema(parsed).ok || (parsed.confidence ?? 0) < 0.6) {
      // fallback
      const fb = keywordFallback(message);
      if (!strictSchema({
        intent: fb.intent,
        eventName: fb.eventName,
        tickets: fb.tickets
      }).ok && fb.intent !== 'show_events') {
        return reply(res, {
          intent: 'unknown',
          message: "Sorry, I couldn't parse that. Try one of these.",
          fallbackSuggestions: FallbackSuggestions
        }, 200);
      }
      return reply(res, {
        ...fb,
        requiresConfirmation: fb.intent === 'propose_booking',
        fallbackSuggestions: FallbackSuggestions
      }, 200);
    }

    return reply(res, {
      ...parsed,
      requiresConfirmation: parsed.intent === 'propose_booking',
      fallbackSuggestions: FallbackSuggestions
    }, 200);
  } catch (e) {
    return reply(res, { intent: 'unknown', message: 'Parser error', error: String(e) }, 500);
  }
});

// Confirm (performs the actual purchase by calling the Client service)
app.post('/api/llm/confirm', async (req, res) => {
  try {
    const { eventId, eventName, tickets } = req.body || {};
    if (!Number.isInteger(tickets) || tickets < 1) return reply(res, { error: 'Invalid tickets' }, 400);

    // if eventId not provided, resolve by name
    let resolvedId = eventId;
    if (!resolvedId && eventName) {
      const { data: events } = await axios.get(`${CLIENT_URL}/api/events`);
      const n = normalize(eventName);
      // simple fuzzy: startsWith or includes
      const match = events.find(
        e => normalize(e.name) === n || normalize(e.name).includes(n) || n.includes(normalize(e.name))
      );
      if (!match) return reply(res, { error: 'Event not found' }, 404);
      resolvedId = match.id;
    }
    if (!resolvedId) return reply(res, { error: 'Missing eventId or eventName' }, 400);

    const r = await axios.post(`${CLIENT_URL}/api/events/${resolvedId}/purchase`, { tickets });
    return reply(res, r.data, 200);
  } catch (e) {
    if (e.response) return reply(res, e.response.data, e.response.status);
    return reply(res, { error: 'Confirm failed', detail: String(e) }, 500);
  }
});

app.listen(PORT, () => console.log(`[llm-driven-booking] listening on :${PORT}`));
