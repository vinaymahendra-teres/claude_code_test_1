// Multi-timer engine — concurrent named timers, persistence, chime, React hook.
// All bakers' tools UI uses `window.useTimers()` to access state and actions.

const TIMERS_KEY = 'tieredcake-timers';
const SOUND_KEY = 'tieredcake-timers-sound';

const TIMER_COLORS = {
  caramel: { ring: 'var(--caramel)', soft: 'var(--caramel-soft)', deep: 'var(--caramel-deep)' },
  rose: { ring: 'var(--rose)', soft: 'var(--rose-soft)', deep: 'oklch(0.38 0.10 25)' },
  sage: { ring: 'var(--sage)', soft: 'var(--sage-soft)', deep: 'oklch(0.34 0.07 145)' },
  plum: { ring: 'var(--plum)', soft: 'oklch(0.93 0.04 340)', deep: 'oklch(0.32 0.10 340)' },
};

window.TIMER_COLORS = TIMER_COLORS;

// ---------- Chime via Web Audio ----------

let _audioCtx = null;
function chime() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain).connect(ctx.destination);
      const t = now + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.20, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (e) { /* audio may be blocked until user gesture */ }
}

// ---------- Duration parsing ----------

window.parseStepDuration = (text) => {
  if (!text) return null;
  // Look for "<n> min", "<n> mins", "<n>m" anywhere in the line.
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?|m\b)/i);
  if (m) return Math.round(parseFloat(m[1]) * 60 * 1000);
  // "30 sec" / "30s"
  const s = String(text).match(/(\d+)\s*(?:sec(?:ond)?s?|s\b)/i);
  if (s) return parseInt(s[1], 10) * 1000;
  return null;
};

window.fmtTimerTime = (ms) => {
  if (ms == null) return '—';
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// ---------- Store ----------

const TimersContext = React.createContext(null);

function computeRemaining(t, now) {
  if (t.status === 'done') return 0;
  if (t.status === 'paused') return Math.max(0, t.totalMs - t.elapsedBeforePause);
  const runElapsed = now - t.startedAt;
  return Math.max(0, t.totalMs - t.elapsedBeforePause - runElapsed);
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(TIMERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch (e) { return []; }
}

function loadSoundOn() {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v == null ? true : v === '1';
  } catch (e) { return true; }
}

function TimersProvider({ children }) {
  const [timers, setTimers] = React.useState(loadInitial);
  const [, force] = React.useReducer(x => x + 1, 0); // tick counter for re-render
  const [soundOn, setSoundOn] = React.useState(loadSoundOn);
  const firedRef = React.useRef(new Set()); // ids that already chimed

  // Persist on change
  React.useEffect(() => {
    try { localStorage.setItem(TIMERS_KEY, JSON.stringify(timers)); } catch (e) {}
  }, [timers]);

  React.useEffect(() => {
    try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) {}
  }, [soundOn]);

  // Tick
  React.useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      let mutated = false;
      setTimers(prev => {
        const next = prev.map(t => {
          if (t.status !== 'running') return t;
          const remaining = computeRemaining(t, now);
          if (remaining <= 0) {
            mutated = true;
            if (!firedRef.current.has(t.id)) {
              firedRef.current.add(t.id);
              if (soundOn) chime();
            }
            return { ...t, status: 'done', doneAt: now };
          }
          return t;
        });
        return mutated ? next : prev;
      });
      force();
    }, 250);
    return () => clearInterval(id);
  }, [soundOn]);

  const start = React.useCallback((opts) => {
    const id = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
    const t = {
      id,
      label: opts.label || 'Timer',
      color: opts.color || 'caramel',
      totalMs: opts.durationMs,
      status: 'running',
      startedAt: Date.now(),
      elapsedBeforePause: 0,
      link: opts.link || null,
      acknowledged: false,
      createdAt: Date.now(),
    };
    setTimers(prev => [...prev, t]);
    return id;
  }, []);

  const pause = React.useCallback((id) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id || t.status !== 'running') return t;
      const elapsed = Date.now() - t.startedAt;
      return { ...t, status: 'paused', elapsedBeforePause: t.elapsedBeforePause + elapsed };
    }));
  }, []);

  const resume = React.useCallback((id) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id || t.status !== 'paused') return t;
      return { ...t, status: 'running', startedAt: Date.now() };
    }));
  }, []);

  const addMs = React.useCallback((id, ms) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.status === 'done') {
        // Re-arm: pretend we just started this much.
        firedRef.current.delete(t.id);
        return { ...t, status: 'running', totalMs: ms, elapsedBeforePause: 0, startedAt: Date.now(), doneAt: null };
      }
      return { ...t, totalMs: t.totalMs + ms };
    }));
  }, []);

  const dismiss = React.useCallback((id) => {
    firedRef.current.delete(id);
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  const restart = React.useCallback((id) => {
    firedRef.current.delete(id);
    setTimers(prev => prev.map(t =>
      t.id === id ? { ...t, status: 'running', startedAt: Date.now(), elapsedBeforePause: 0, doneAt: null } : t
    ));
  }, []);

  const muteToggle = React.useCallback(() => setSoundOn(v => !v), []);

  // Decorate with live remaining
  const now = Date.now();
  const decorated = timers.map(t => ({ ...t, remainingMs: computeRemaining(t, now) }));

  const api = {
    timers: decorated,
    running: decorated.filter(t => t.status === 'running'),
    paused: decorated.filter(t => t.status === 'paused'),
    done: decorated.filter(t => t.status === 'done'),
    soundOn, muteToggle,
    start, pause, resume, addMs, dismiss, restart,
  };

  return React.createElement(TimersContext.Provider, { value: api }, children);
}

window.TimersProvider = TimersProvider;
window.useTimers = () => React.useContext(TimersContext);
