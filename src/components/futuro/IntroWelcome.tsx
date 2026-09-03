import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { futuroSite } from "@/lib/futuro/site";
import { useMemoria, guardarNombre } from "@/lib/futuro/store";
import { readBibliotecaIdentity } from "@/lib/futuro/identity";

const SESSION_FLAG = "ees6-futuro-intro-v1";
// El equipo que administra contenidos entra por acá, no es la experiencia
// de alumnos/docentes navegando la orientación — no tiene sentido mostrarles
// la bienvenida animada.
const SKIP_PATHS = ["/tu-futuro/auth", "/tu-futuro/admin"];

type Stage = "hidden" | "logo" | "greet" | "ask";

function primerNombre(nombreCompleto: string): string {
  return nombreCompleto.trim().split(/\s+/)[0] ?? nombreCompleto;
}

export function IntroWelcome() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const memoria = useMemoria();
  const skip = SKIP_PATHS.some((p) => pathname.startsWith(p));

  const [stage, setStage] = useState<Stage>("hidden");
  const [visible, setVisible] = useState(true);
  const [nombreInput, setNombreInput] = useState("");

  useEffect(() => {
    if (skip || typeof window === "undefined") return;

    let yaMostrada = false;
    try {
      yaMostrada = window.sessionStorage.getItem(SESSION_FLAG) === "1";
    } catch {
      yaMostrada = false;
    }
    if (yaMostrada) return;

    const identidad = readBibliotecaIdentity();
    if (identidad) guardarNombre(identidad.name, identidad.role);

    const reducida =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setStage("logo");
    const timer = window.setTimeout(
      () => setStage(identidad?.name ? "greet" : "ask"),
      reducida ? 150 : 1000,
    );
    return () => window.clearTimeout(timer);
    // Solo debe correr una vez por montaje real de la sección (cuando deja
    // de estar en una ruta de staff), no en cada cambio de memoria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  useEffect(() => {
    if (stage !== "greet") return;
    const timer = window.setTimeout(() => dismiss(), 2200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function dismiss() {
    setVisible(false);
    window.setTimeout(() => {
      setStage("hidden");
      try {
        window.sessionStorage.setItem(SESSION_FLAG, "1");
      } catch {
        /* almacenamiento no disponible: la intro puede repetirse, no rompe nada */
      }
    }, 450);
  }

  function confirmarNombre(event: FormEvent) {
    event.preventDefault();
    const limpio = nombreInput.trim();
    if (!limpio) {
      dismiss();
      return;
    }
    guardarNombre(limpio, "visitante");
    setStage("greet");
  }

  const nombreParaSaludo = useMemo(() => {
    const nombre = readBibliotecaIdentity()?.name ?? memoria.nombre;
    return nombre ? primerNombre(nombre) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoria.nombre, stage]);

  if (skip || stage === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-label="Bienvenida a Tu futuro"
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-brand-navy text-white transition-opacity duration-[450ms] ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="hero-gradient intro-kenburns absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <img
          src={futuroSite.logo}
          alt=""
          className="intro-logo h-20 w-20 rounded-full bg-white/95 p-3 shadow-elegant"
        />

        {stage === "logo" && (
          <p className="intro-text mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            {futuroSite.escuela}
          </p>
        )}

        {stage === "greet" && (
          <div className="intro-text mt-6" role="status">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              <Sparkles className="h-4 w-4" /> Tu futuro
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              {nombreParaSaludo ? `¡Bienvenido, ${nombreParaSaludo}!` : "¡Bienvenido!"}
            </h1>
            <p className="mt-2 text-sm text-white/80">Orientación Académica · EES N.º 6</p>
          </div>
        )}

        {stage === "ask" && (
          <form onSubmit={confirmarNombre} className="intro-text mt-6 w-full max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              Tu futuro
            </p>
            <p className="mt-3 text-base font-semibold">¿Cómo te llamás?</p>
            <input
              autoFocus
              value={nombreInput}
              onChange={(e) => setNombreInput(e.target.value)}
              placeholder="Ej.: Joaquín"
              maxLength={60}
              className="mt-3 w-full rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-center text-sm text-white placeholder:text-white/50 outline-none focus:border-white focus:ring-2 focus:ring-white/30"
            />
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy hover:opacity-90"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                Omitir
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
