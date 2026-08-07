import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import { blockedWordsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { suggestName, toTitleCase, validateStudentName } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/")({
  head: () => ({
    meta: [
      { title: "Biblioteca Digital — E.E.S. N.º 6 Lobos" },
      {
        name: "description",
        content:
          "Materiales de estudio, novedades y calendario escolar de la Escuela de Educación Secundaria N.º 6 de Lobos, organizados por año y materia.",
      },
      { property: "og:title", content: "Biblioteca Digital — E.E.S. N.º 6 Lobos" },
      {
        property: "og:description",
        content: "Materiales de estudio organizados por año y materia para estudiantes de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: BibliotecaPortal,
});

function BibliotecaPortal() {
  const navigate = useNavigate();
  const { student, ready, signInStudent } = useBibliotecaSession();
  const { data: blocked = [] } = useQuery(blockedWordsQuery);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && student) navigate({ to: "/biblioteca/inicio" });
  }, [ready, student, navigate]);

  const suggestion = suggestName(name);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const pretty = toTitleCase(name);
    const check = validateStudentName(pretty, blocked);
    if (!check.ok) {
      setError(check.message ?? "Revisá tu nombre.");
      return;
    }
    signInStudent(pretty);
    navigate({ to: "/biblioteca/inicio" });
  }

  return (
    <div className="surface-institutional flex min-h-screen flex-col items-center justify-center px-4 py-12 text-primary-foreground">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoAsset.url}
            alt="Escudo de la E.E.S. N.º 6"
            className="size-20 rounded-full bg-white/95 p-2 shadow-soft"
          />
          <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Biblioteca Digital</h1>
          <p className="mt-2 text-sm opacity-85 sm:text-base">
            Escuela de Educación Secundaria N.º 6 · Lobos, Buenos Aires
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl bg-card p-6 text-card-foreground shadow-xl"
        >
          <h2 className="font-display text-xl font-semibold">Ingresá con tu nombre</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usá tu nombre y apellido reales para entrar al espacio de estudiantes.
          </p>
          <label className="mt-4 block text-sm font-medium" htmlFor="bib-nombre">
            Nombre y apellido
          </label>
          <input
            id="bib-nombre"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Ej.: María López"
            autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
          />
          {suggestion && suggestion !== name ? (
            <button
              type="button"
              onClick={() => setName(suggestion)}
              className="mt-2 text-sm text-primary underline underline-offset-4"
            >
              ¿Quisiste decir “{suggestion}”?
            </button>
          ) : null}
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BookOpen className="size-4" /> Entrar a la biblioteca
          </button>

          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/biblioteca/acceso"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <GraduationCap className="size-4" /> Soy docente
            </a>
            <a href="/" className="text-muted-foreground hover:text-foreground">
              Volver al sitio de la escuela
            </a>
          </div>
        </form>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs opacity-80">
          <Sparkles className="size-3.5" /> Materiales cargados por el equipo docente de la escuela.
        </p>
      </div>
    </div>
  );
}