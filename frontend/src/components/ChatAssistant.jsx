import React, { useEffect, useRef, useState } from 'react';
import { supportsSTT, supportsTTS, speak, stopSpeaking, createRecognizer, startBeep, stopBeep } from '../lib/voice';
import { useAuth } from '../context/AuthContext.jsx';

// API base URL for the client-service microservice
// In dev: falls back to localhost:xxxx
const API_BASE =
  import.meta.env.VITE_CLIENT_API_URL || 'http://localhost:6001';

const LLM_BASE =
  import.meta.env.VITE_LLM_API_URL || 'http://localhost:7000';

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can show events and prepare a booking. Try “show events” or “book 2 for Jazz Night”.' }
  ]);
  const [input, setInput] = useState('');
  const [events, setEvents] = useState([]);
  const [proposal, setProposal] = useState(null);       // { eventId?, eventName, tickets }
  const [suggestions, setSuggestions] = useState(['show events', 'book 2 for <event name>']);

  // ---- Voice state
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const recognizerRef = useRef(null);
  const liveRef = useRef();

  const { token } = useAuth();

  const push = (m) => {
    setMessages((prev) => {
      const next = [...prev, m];
      // Auto TTS for assistant messages when enabled
      if (ttsEnabled && m.role === 'assistant' && supportsTTS()) {
        speak(m.text);
      }
      return next;
    });
  };

  function asEventArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.events)) return data.events;
    return [];
  }

  async function fetchEvents() {
    try {
      const r = await fetch(`${API_BASE}/api/events`);
      const raw = await r.json();
      const list = asEventArray(raw);
      setEvents(list);
      if (list.length === 0) {
        push({ role: 'assistant', text: 'No events found.' });
        return;
      }
      push({ role: 'assistant', text: `Here are the current events (${list.length}):` });
      push({
        role: 'assistant',
        text: list.map(e => `• ${e.name ?? e.title ?? `Event #${e.id}`} — ${(e.available_tickets ?? e.tickets)} available`).join('\n')
      });
    } catch (e) {
      push({ role: 'assistant', text: 'Network error fetching events. Try again.' });
    }
  }

  function resolveId(list, name) {
    if (!name) return undefined;
    const n = name.toLowerCase();
    const exact = list.find(e => (e.name ?? '').toLowerCase() === n || (e.title ?? '').toLowerCase() === n);
    if (exact) return exact.id;
    const contains = list.find(e =>
      (e.name ?? '').toLowerCase().includes(n) ||
      (e.title ?? '').toLowerCase().includes(n) ||
      n.includes((e.name ?? '').toLowerCase()) ||
      n.includes((e.title ?? '').toLowerCase())
    );
    return contains?.id;
  }

  async function handleSend(e) {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    push({ role: 'user', text: msg });
    setInput('');
    stopSpeaking(); // stop TTS if it was playing

    try {
      const r = await fetch(`${LLM_BASE}/api/llm/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await r.json();

      if (Array.isArray(data.fallbackSuggestions) && data.fallbackSuggestions.length) {
        setSuggestions(data.fallbackSuggestions);
      }

      if (data.intent === 'show_events') {
        return fetchEvents();
      }

      if (data.intent === 'propose_booking') {
        let list = events;
        if (!list.length) {
          const rr = await fetch(`${API_BASE}/api/events`);
          const raw = await rr.json();
          list = asEventArray(raw);
          setEvents(list);
        }
        const eventId = resolveId(list, data.eventName);
        setProposal({ eventId, eventName: data.eventName, tickets: data.tickets });

        push({
          role: 'assistant',
          text: `I can book ${data.tickets} ticket(s) for “${data.eventName}”. ${eventId ? '' : '(I couldn’t confirm the exact event, but you can still confirm.)'}`
        });
        return;
      }

      push({
        role: 'assistant',
        text: data.message || `Sorry, I couldn't parse that. Try ${suggestions.map(s => `“${s}”`).join(', ')}.`
      });
    } catch (err) {
      push({ role: 'assistant', text: 'Network error. Try again.' });
    }
  }

  async function handleConfirm() {
    if (!proposal) return;
    stopSpeaking();
    try {
      const payload = { tickets: proposal.tickets };
      if (proposal.eventId) payload.eventId = proposal.eventId; else payload.eventName = proposal.eventName;

      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const r = await fetch(`${LLM_BASE}/api/llm/confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await r.json();

      if (r.ok) {
        push({ role: 'assistant', text: `✅ Booked ${data.tickets} for event #${data.eventId}.` });
        setProposal(null);
        await fetchEvents();
      } else {
        push({ role: 'assistant', text: `❌ ${data.error || 'Booking failed'}` });
      }
    } catch {
      push({ role: 'assistant', text: 'Network error while confirming. Try again.' });
    }
  }

  function handleCancel() {
    setProposal(null);
    stopSpeaking();
    push({ role: 'assistant', text: 'Okay—canceled the proposal.' });
  }

  // ---- Voice controls ----
  async function startListening() {
    if (!supportsSTT() || isListening) return;
    stopSpeaking();

      // Play a short beep BEFORE the recognizer starts
    try { await startBeep(); } catch {}

    const rec = createRecognizer({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      onResult: ({ finalText, interimText }) => {
        if (interimText) setInterim(interimText);
        if (finalText) {
          setInterim('');
          setInput(finalText);
        }
      },
      onEnd: () => setIsListening(false),
      onError: () => setIsListening(false)
    });

    if (!rec) return;
    recognizerRef.current = rec;
    setIsListening(true);
    try { rec.start(); } catch { setIsListening(false); }
  }

  function stopListening() {
    if (!recognizerRef.current) return;
    try { recognizerRef.current.stop(); } catch {}
    setIsListening(false);
    setInterim('');
  }

  function toggleListening() {
    if (!supportsSTT()) {
      push({ role: 'assistant', text: 'Voice input is not supported in this browser.' });
      return;
    }
    if (isListening) stopListening(); else startListening();
  }

  function toggleTTS() {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    if (!next) stopSpeaking();
  }

  return (
    <div className="chat-assistant" style={{ display: 'grid', gap: 8 }}>
      {/* A11y: announces the latest assistant message */}
      <div className="sr-only" aria-live="polite" ref={liveRef}>
        {messages[messages.length - 1]?.text}
      </div>

      <div
        className="chat-log"
        style={{
          whiteSpace: 'pre-wrap',
          border: '1px solid #ddd',
          padding: 12,
          borderRadius: 8,
          marginBottom: 8,
          height: 280,
          overflow: 'auto',
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '6px 0' }}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong> {m.text}
          </div>
        ))}
        {isListening && interim && (
          <div style={{ margin: '6px 0', opacity: 0.7 }}>
            <strong>Listening…</strong> {interim}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={fetchEvents} aria-label="Show events">Show events</button>
        {proposal && (
          <>
            <button onClick={handleConfirm} aria-label="Confirm booking">Confirm booking</button>
            <button onClick={handleCancel} aria-label="Cancel booking">Cancel</button>
          </>
        )}
        <button onClick={toggleListening} aria-label={isListening ? 'Stop microphone' : 'Start microphone'}>
          {isListening ? '🎙️ Stop' : '🎙️ Talk'}
        </button>
        <button onClick={toggleTTS} aria-label={ttsEnabled ? 'Disable speech' : 'Enable speech'}>
          {ttsEnabled ? '🔊 Speech: On' : '🔇 Speech: Off'}
        </button>
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type or use mic — e.g., "book 2 for Jazz Night"'
          aria-label="Chat input"
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
