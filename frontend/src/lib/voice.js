// src/lib/voice.js
// Minimal wrapper around Web Speech APIs with graceful fallbacks.
// STT: SpeechRecognition (Chrome/Edge ok). TTS: speechSynthesis (most modern).

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  // Resume if suspended (autoplay policies)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function supportsSTT() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function supportsTTS() {
  return 'speechSynthesis' in window;
}

// ---- TTS (speak) ----
let ttsUtterance = null;

export function speak(text, { rate = 1, pitch = 1, volume = 1, lang } = {}) {
  if (!supportsTTS() || !text) return;
  window.speechSynthesis.cancel();
  ttsUtterance = new SpeechSynthesisUtterance(text);
  if (lang) ttsUtterance.lang = lang;
  ttsUtterance.rate = rate;
  ttsUtterance.pitch = pitch;
  ttsUtterance.volume = volume;
  window.speechSynthesis.speak(ttsUtterance);
}

export function stopSpeaking() {
  if (!supportsTTS()) return;
  window.speechSynthesis.cancel();
}

// ---- Web Audio "beep" helpers ----
/**
 * Play a single short beep. Returns a Promise that resolves when done.
 */
export function playBeep({ freq = 880, duration = 180, type = 'sine', volume = 0.15 } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return Promise.resolve();

  return new Promise((resolve) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;

    osc.connect(gain).connect(ctx.destination);
    osc.start();

    setTimeout(() => {
      // Smooth stop to avoid click
      const t = ctx.currentTime;
      gain.gain.setTargetAtTime(0, t, 0.015);
      setTimeout(() => {
        try { osc.stop(); } catch {}
        try { osc.disconnect(); gain.disconnect(); } catch {}
        resolve();
      }, 60);
    }, duration);
  });
}

/**
 * Start beep: single short tone.
 */
export function startBeep() {
  return playBeep({ freq: 880, duration: 160, type: 'sine', volume: 0.18 });
}

/**
 * Stop beep: quick double-beep (optional).
 */
export async function stopBeep() {
  await playBeep({ freq: 660, duration: 120, type: 'sine', volume: 0.16 });
  await new Promise(r => setTimeout(r, 60));
  await playBeep({ freq: 520, duration: 120, type: 'sine', volume: 0.16 });
}

// ---- STT (listen) ----
export function createRecognizer({ lang = 'en-US', interimResults = true, continuous = false, onResult, onEnd, onError } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = interimResults;
  rec.continuous = continuous;

  rec.onresult = (e) => {
    let finalText = '';
    let interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interimText += t;
    }
    onResult?.({ finalText: finalText.trim(), interimText: interimText.trim() });
  };

  rec.onerror = (e) => onError?.(e);
  rec.onend = () => onEnd?.();
  return rec;
}
