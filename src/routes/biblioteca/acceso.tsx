import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca/acceso")({
  head: () => ({
    meta: [
      { title: "Acceso docente — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Acceso del equipo docente de la E.E.S. N.º 6 para publicar materiales, novedades y fechas del calendario escolar.",
      },
      { property: "og:title", content: "Acceso docente — Biblioteca Digital E.E.S. N.º 6" },
      {
        property: "og:description",
        content: "Ingreso del equipo docente a la Biblioteca Digital de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: AccesoDocente,
});

function AccesoDocente() {
  const navigate = useNavigate();
  const { teacher, ready, signInTeacher } = useBibliotecaSession();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && teacher) navigate({ to: "/biblioteca/panel" });
  }, [ready, teacher, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInTeacher({ code, name });
      navigate({ to: "/biblioteca/panel" });
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
            src={logoAsset.url}
            alt="Escudo de la E.E.S. N.º 6"
            className="size-16 rounded-full bg-white/95 p-2 shadow-soft"
          />
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Acceso docente</h1>
          <p className="mt-1.5 text-sm opacity-85">
            Ingresá con el código institucional para administrar la biblioteca.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
          <label className="block text-sm font-medium" htmlFor="doc-nombre">
            Nombre para mostrar (opcional)
          </label>
          <input
            id="doc-nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej.: Prof. Ana Gómez"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="doc-codigo">
            Código institucional
          </label>
          <div className="relative mt-1.5">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="doc-codigo"
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
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <ShieldCheck className="size-4" /> {loading ? "Verificando…" : "Ingresar al panel"}
          </button>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
            <a href="/biblioteca" className="text-primary hover:underline">
              Soy estudiante
            </a>
            <a href="/" className="text-muted-foreground hover:text-foreground">
              Volver al sitio
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}