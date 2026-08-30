import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/logo.png";
import { blockedWordsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { suggestName, toTitleCase, validateStudentName } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/estudiante")({
  head: () => ({
    meta: [
      { title: "Ingreso de estudiantes — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Ingresá con tu nombre y tu año para ver los materiales y comunicados que corresponden a tu curso.",
      },
      { property: "og:title", content: "Ingreso de estudiantes — Biblioteca Digital E.E.S. N.º 6" },
      {
        property: "og:description",
        content: "Materiales y comunicados según tu año en la E.E.S. N.º 6 de Lobos.",
      },
    ],
  }),
  component: IngresoEstudiante,
});

const YEARS = [1, 2, 3, 4, 5, 6];

function IngresoEstudiante() {
  const navigate = useNavigate();
  const { signInStudent } = useBibliotecaSession();
  const { data: blocked = [] } = useQuery(blockedWordsQuery);
  const [name, setName] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestion = suggestName(name);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const pretty = toTitleCase(name);
    const check = validateStudentName(pretty, blocked);
    if (!check.ok) {
      setError(check.message ?? "Revisá tu nombre.");
      return;
    }
    if (!year) {
      setError("Elegí el año que estás cursando.");
      return;
    }
    signInStudent(pretty, year);
    navigate({ to: "/biblioteca/inicio" });
  }

  return (
    <div className="surface-institutional flex min-h-screen items-center justify-center px-4 py-12 text-primary-foreground">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoAsset}
            alt="Escudo de la E.E.S. N.º 6"
            className="size-16 rounded-full bg-white/95 p-2 shadow-soft"
          />
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Soy estudiante</h1>
          <p className="mt-1.5 text-sm opacity-85">
            Vas a ver los materiales y comunicados de tu año.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 rounded-2xl bg-card p-6 text-card-foreground shadow-xl">
          <label className="block text-sm font-medium" htmlFor="bib-nombre">
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

          <p className="mt-5 text-sm font-medium">¿Qué año cursás?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  setYear(y);
                  setError(null);
                }}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  year === y
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-secondary"
                }`}
              >
                {y}.º año
              </button>
            ))}
          </div>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BookOpen className="size-4" /> Entrar a la biblioteca
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