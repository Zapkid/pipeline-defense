// ────────────────────────────────────────────────────────────
// SFX — tiny WebAudio synth, no assets
// ────────────────────────────────────────────────────────────
const SFX = (() => {
  let actx = null;
  let muted = false;
  try { muted = localStorage.getItem('pd_mute') === '1'; } catch (e) {}
  let lastShot = 0;

  function ctx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function tone({ f = 440, f2 = null, t = 'square', d = 0.08, v = 0.07, delay = 0 }) {
    if (muted) return;
    const c = ctx();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    const t0 = c.currentTime + delay;
    o.type = t;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + d);
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + d + 0.02);
  }

  const SHOT_PITCH = {
    unit: 880, cypress: 820, selenium: 400, playwright: 600, postman: 700,
    integration: 520, db: 300, e2e: 240, docker: 200, perf: 180, ai: 990
  };

  return {
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('pd_mute', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    shoot(type) {
      const now = performance.now();
      if (now - lastShot < 45) return;  // throttle the shot chatter
      lastShot = now;
      const base = SHOT_PITCH[type] || 600;
      tone({ f: base, f2: base * 0.6, t: 'square', d: 0.05, v: 0.025 });
    },
    kill()    { tone({ f: 660, f2: 990, t: 'square', d: 0.07, v: 0.045 }); },
    leak()    { tone({ f: 220, f2: 110, t: 'sawtooth', d: 0.35, v: 0.11 }); },
    wave()    { tone({ f: 330, d: 0.08, v: 0.055 }); tone({ f: 440, d: 0.08, v: 0.055, delay: 0.09 }); },
    clear()   { tone({ f: 523, t: 'triangle', d: 0.09 }); tone({ f: 659, t: 'triangle', d: 0.09, delay: 0.1 }); tone({ f: 784, t: 'triangle', d: 0.12, delay: 0.2 }); },
    place()   { tone({ f: 500, f2: 700, t: 'triangle', d: 0.06 }); },
    upgrade() { tone({ f: 600, f2: 1200, d: 0.12 }); },
    sell()    { tone({ f: 400, f2: 200, t: 'triangle', d: 0.12, v: 0.06 }); },
    triage()  { tone({ f: 880, t: 'sine', d: 0.3 }); tone({ f: 1108, t: 'sine', d: 0.3, v: 0.06, delay: 0.05 }); },
    win()     { [523, 659, 784, 1046].forEach((f, i) => tone({ f, t: 'triangle', d: 0.18, v: 0.08, delay: i * 0.13 })); },
    lose()    { [392, 330, 262, 196].forEach((f, i) => tone({ f, t: 'sawtooth', d: 0.2, delay: i * 0.15 })); },
    ui()      { tone({ f: 700, d: 0.03, v: 0.03 }); }
  };
})();
