import { useEffect, useState } from "react";
import intro1 from "@/assets/intro-2021.jpg.asset.json";
import intro2 from "@/assets/intro-2023b.jpg.asset.json";
import intro3 from "@/assets/intro-2023.jpg.asset.json";
import intro4 from "@/assets/intro-2025.jpg.asset.json";
import intro5 from "@/assets/intro-2026.jpg.asset.json";
import logo from "@/assets/logo.png.asset.json";
import { startInstitutionalMusic, stopMusic, setMusicVolume } from "@/lib/sound";

const SESSION_KEY = "ees6-intro-seen";

const SLIDES = [
  { url: intro1.url },
  { url: intro2.url },
  { url: intro3.url },
  { url: intro4.url },
  { url: intro5.url },
];

const SLIDE_MS = 2200;
const HOLD_LAST_MS = 2400;
const FADE_OUT_MS = 900;

export function Intro({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const TARGET_VOL = 0.14;
  const stopAudio = () => stopMusic(900);

  useEffect(() => {
    let cancelled = false;
    const tryStart = async () => {
      const h = await startInstitutionalMusic(TARGET_VOL);
      if (!h) {
        if (!cancelled) setNeedsUnlock(true);
        const unlock = async () => {
          const hh = await startInstitutionalMusic(TARGET_VOL);
          if (hh && !cancelled) setNeedsUnlock(false);
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
          window.removeEventListener("touchstart", unlock);
        };
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true });
      }
    };
    tryStart();
    return () => {
      cancelled = true;
      stopMusic(400);
    };
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    SLIDES.forEach((_, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => setIndex(i), i * SLIDE_MS));
    });
    const total = (SLIDES.length - 1) * SLIDE_MS + HOLD_LAST_MS;
    timers.push(
      setTimeout(() => {
        setFadingOut(true);
        stopAudio();
      }, total),
    );
    timers.push(
      setTimeout(() => {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // ignore
        }
        onDone();
      }, total + FADE_OUT_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-[900ms] ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden={fadingOut}
    >
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <img
            src={s.url}
            alt=""
            className="h-full w-full object-cover intro-kenburns"
            style={{ animationPlayState: i === index ? "running" : "paused" }}
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <img
          src={logo.url}
          alt="Logo EES N.º 6"
          className="mb-8 h-24 w-24 object-contain drop-shadow-2xl intro-logo sm:h-28 sm:w-28"
        />
        <div key={isLast ? "last" : "main"} className="intro-text max-w-3xl">
          {isLast ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80 sm:text-sm">
                Bienvenidos a la Institución
              </div>
              <h1 className="mt-4 font-serif text-3xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                Escuela de Educación Secundaria N.º 6
              </h1>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                Escuela de Educación Secundaria N.º 6
              </h1>
              <p className="mt-5 text-base italic text-white/85 sm:text-lg md:text-xl">
                "Una historia construida por generaciones de estudiantes."
              </p>
            </>
          )}
        </div>
        <button
          onClick={() => {
            stopAudio();
            try {
              sessionStorage.setItem(SESSION_KEY, "1");
            } catch {
              // ignore
            }
            onDone();
          }}
          className="absolute bottom-6 right-6 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/20"
        >
          Saltar intro
        </button>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setMusicVolume(next ? 0.0001 : TARGET_VOL);
          }}
          aria-label={muted ? "Activar sonido" : "Silenciar música"}
          className="absolute bottom-6 left-6 rounded-full border border-white/40 bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/20"
        >
          {muted ? "🔇 Sonido" : "🔊 Música"}
        </button>
        {needsUnlock && (
          <button
            onClick={async () => {
              const h = await startInstitutionalMusic(TARGET_VOL);
              if (h) setNeedsUnlock(false);
            }}
            className="absolute top-6 right-6 rounded-full border border-white/50 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            ▶ Activar música
          </button>
        )}
      </div>
    </div>
  );
}

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return true;
  }
}