import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/logo.png";
import type { StaffRole } from "@/lib/biblioteca/messages.functions";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca/ingreso/$rol")({
  head: () => ({
    meta: [
      { title: "Acceso del personal — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Ingreso de preceptoría y dirección a la Biblioteca Digital de la E.E.S. N.º 6 de Lobos.",
      },
      { property: "og:title", content: "Acceso del personal — Biblioteca Digital E.E.S. N.º 6" },
      {
        property: "og:description",
        content: "Ingreso institucional de preceptoría y dirección.",
      },
    ],
  }),
  component: IngresoPersonal,
});

const PROFILES: Record<string, { role: StaffRole; title: string; hint: string }> = {
  preceptor: {
    role: "preceptor",
    title: "Soy preceptor/a",
    hint: "Ingresá con el código de preceptoría para enviar comunicados y ver tu bandeja.",
  },
  directivo: {
    role: "directivo",
    title: "Soy directivo/a",
    hint: "Ingresá con el código de dirección para comunicarte con toda la comunidad.",
  },
};

function IngresoPersonal() {
  const { rol } = useParams({ from: "/biblioteca/ingreso/$rol" });
  const navigate = useNavigate();
  const { signInTeacher } = useBibliotecaSession();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const profile = PROFILES[rol];

  if (!profile) {
    return (
      <div className="surface-institutional flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-primary-foreground">
        <h1 className="font-display text-2xl font-bold">Perfil no disponible</h1>
        <Link to="/biblioteca" className="rounded-lg bg-white/15 px-4 py-2.5 text-sm font-medium">
          Volver a elegir perfil
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      await signInTeacher({ code, name, role: profile.role });
      navigate({ to: "/biblioteca/panel/comunicados" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos verificar el código.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-institutional flex min-h-screen items-center justify-center px-4 py-12 text-primary-foreground">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoAsset}
            alt="Escudo de la E.E.S. N.º 6"
            className="size-16 rounded-full bg-white/95 p-2 shadow-soft"
          />
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">{profile.title}</h1>
          <p className="mt-1.5 text-sm opacity-85">{profile.hint}</p>
        </div>

        <form onSubmit={submit} className="mt-7 rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
          <label className="block text-sm font-medium" htmlFor="staff-nombre">
            Nombre para mostrar
          </label>
          <input
            id="staff-nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej.: Prof. Ana Gómez"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="staff-codigo">
            Código de acceso
          </label>
          <div className="relative mt-1.5">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="staff-codigo"
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || code.trim().length === 0}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <ShieldCheck className="size-4" /> {loading ? "Verificando…" : "Ingresar"}
          </button>

          <div className="mt-5 border-t border-border pt-4 text-sm">
            <Link to="/biblioteca" className="text-muted-foreground hover:text-foreground">
              Elegir otro perfil
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}