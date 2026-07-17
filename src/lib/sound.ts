// Minimalist WebAudio helpers — no external assets.
// Provides:
//  - getCtx(): shared AudioContext (created lazily after a user gesture)
//  - playClick(): a short, minimalist click sound
//  - installGlobalClickSound(): attaches a single global pointerdown handler
//  - startInstitutionalMusic(): a slow hymn-like ambient pad chord progression

let ctx: AudioContext | null = null;
let clickInstalled = false;
let musicHandle:
  | { stop: (fadeMs?: number) => void; setVolume: (v: number) => void }
  | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

async function ensureRunning() {
  const c = getCtx();
  if (!c) return null;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      // ignore
    }
  }
  return c;
}

export async function playClick() {
  const c = await ensureRunning();
  if (!c) return;
  const now = c.currentTime;

  // High-pitched short blip (soft, minimalist UI click).
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1600, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

export function installGlobalClickSound() {
  if (typeof window === "undefined" || clickInstalled) return;
  clickInstalled = true;
  const handler = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    // Only trigger for interactive elements to avoid noise on generic clicks.
    const interactive = t.closest(
      'button, a, [role="button"], input[type="button"], input[type="submit"], summary, label, select, [data-click-sound]',
    );
    if (!interactive) return;
    // Respect explicit opt-out
    if ((interactive as HTMLElement).dataset.noClickSound !== undefined) return;
    void playClick();
  };
  window.addEventListener("pointerdown", handler, { capture: true, passive: true });
}

// Slow, calm, hymn-like chord progression using triangle-wave pads.
// Frequencies (Hz) — simple triads in C major, low register.
const CHORDS: number[][] = [
  [130.81, 164.81, 196.0], // C major (C3 E3 G3)
  [110.0, 146.83, 174.61], // A minor
  [146.83, 174.61, 220.0], // D minor
  [196.0, 246.94, 293.66], // G major
];
const CHORD_MS = 4200;

export async function startInstitutionalMusic(targetVolume = 0.16) {
  const c = await ensureRunning();
  if (!c) return null;
  if (musicHandle) return musicHandle;

  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  // Gentle low-pass to keep it warm.
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1600;
  filter.connect(master);

  let stopped = false;
  let chordIndex = 0;
  let currentOscs: OscillatorNode[] = [];
  let currentGain: GainNode | null = null;

  const playChord = () => {
    if (stopped) return;
    const now = c.currentTime;
    const freqs = CHORDS[chordIndex % CHORDS.length];
    chordIndex++;

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 1.2);
    g.gain.setValueAtTime(0.9, now + CHORD_MS / 1000 - 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, now + CHORD_MS / 1000);
    g.connect(filter);

    const oscs: OscillatorNode[] = [];
    for (const f of freqs) {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const og = c.createGain();
      og.gain.value = 0.25;
      o.connect(og).connect(g);
      o.start(now);
      o.stop(now + CHORD_MS / 1000 + 0.2);
      oscs.push(o);
    }
    currentOscs = oscs;
    currentGain = g;
  };

  // Fade master in.
  const now0 = c.currentTime;
  master.gain.setValueAtTime(0.0001, now0);
  master.gain.exponentialRampToValueAtTime(targetVolume, now0 + 2.0);

  playChord();
  const interval = setInterval(playChord, CHORD_MS);

  musicHandle = {
    stop: (fadeMs = 900) => {
      if (stopped) return;
      stopped = true;
      clearInterval(interval);
      const t = c.currentTime;
      try {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value || 0.0001, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + fadeMs / 1000);
      } catch {
        // ignore
      }
      setTimeout(() => {
        try {
          currentOscs.forEach((o) => o.stop());
        } catch {
          // ignore
        }
        try {
          currentGain?.disconnect();
          filter.disconnect();
          master.disconnect();
        } catch {
          // ignore
        }
        musicHandle = null;
      }, fadeMs + 50);
    },
    setVolume: (v: number) => {
      const t = c.currentTime;
      try {
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value || 0.0001, t);
        master.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + 0.25);
      } catch {
        // ignore
      }
    },
  };
  return musicHandle;
}

export function setMusicVolume(v: number) {
  musicHandle?.setVolume(v);
}

export function isMusicPlaying() {
  return musicHandle !== null;
}

export function stopMusic(fadeMs = 900) {
  musicHandle?.stop(fadeMs);
}