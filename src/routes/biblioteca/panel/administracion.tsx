import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/biblioteca/AppShell";
import { blockedWordsQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import {
  bibDeleteSubject,
  bibSaveBlockedWords,
  bibSaveSubject,
} from "@/lib/biblioteca/teacher.functions";
import { YEARS, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/panel/administracion")({
  head: () => ({
    meta: [
      { title: "Administración — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Gestioná las materias por año y las palabras bloqueadas del filtro de nombres de la Biblioteca Digital de la E.E.S. N.º 6.",
      },
      { property: "og:title", content: "Administración — Biblioteca Digital" },
      {
        property: "og:description",
        content: "Materias y filtros de la Biblioteca Digital de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: AdministracionPage,
});

function AdministracionPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { teacher, ready } = useBibliotecaSession();
  const {
    data: subjects = [],
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useQuery(subjectsQuery);
  const {
    data: blocked = [],
    isError: blockedError,
    refetch: refetchBlocked,
  } = useQuery(blockedWordsQuery);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState(1);
  const [words, setWords] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  const saveSubject = useMutation({
    mutationFn: async () =>
      bibSaveSubject({
        data: { code: teacher?.credential ?? "", subject: { code, name, year } },
      }),
    onSuccess: async () => {
      toast.success("Materia guardada.");
      setCode("");
      setName("");
      await qc.invalidateQueries({ queryKey: ["biblioteca", "subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSubject = useMutation({
    mutationFn: async (subjectCode: string) =>
      bibDeleteSubject({ data: { code: teacher?.credential ?? "", subjectCode } }),
    onSuccess: async () => {
      toast.success("Materia eliminada.");
      await qc.invalidateQueries({ queryKey: ["biblioteca", "subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveWords = useMutation({
    mutationFn: async () =>
      bibSaveBlockedWords({
        data: {
          code: teacher?.credential ?? "",
          words: (words ?? "").split(/[\n,]/).map((w) => w.trim()),
        },
      }),
    onSuccess: async () => {
      toast.success("Filtro actualizado.");
      await qc.invalidateQueries({ queryKey: ["biblioteca", "blocked_words"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ready || !teacher) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <AppShell area="profesor">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Administración</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Materias disponibles y filtro de nombres para el ingreso de estudiantes.
      </p>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Materias</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,8rem)_auto]">
          <input
            aria-label="Código de la materia"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código (ej.: MAT1)"
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          />
          <input
            aria-label="Nombre de la materia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          />
          <select
            aria-label="Año"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {yearLabel(y)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => saveSubject.mutate()}
            disabled={!code.trim() || !name.trim() || saveSubject.isPending}
            className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
          >
            Guardar
          </button>
        </div>

        {subjectsError && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-destructive">
            No pudimos cargar las materias existentes.
            <button
              type="button"
              onClick={() => refetchSubjects()}
              className="font-medium underline underline-offset-2"
            >
              Reintentar
            </button>
          </p>
        )}
        <ul className="mt-5 divide-y divide-border">
          {subjects.map((s) => (
            <li key={s.code} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-medium">{s.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {s.code} · {yearLabel(s.year)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeSubject.mutate(s.code)}
                className="shrink-0 rounded-md px-2 py-1 text-destructive hover:bg-secondary"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Palabras bloqueadas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Una por línea o separadas por comas. Se usan para validar los nombres de estudiantes.
        </p>
        {blockedError && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-destructive">
            No pudimos cargar la lista actual de palabras bloqueadas. Guardar ahora la reemplazaría por
            una lista vacía.
            <button
              type="button"
              onClick={() => refetchBlocked()}
              className="font-medium underline underline-offset-2"
            >
              Reintentar
            </button>
          </p>
        )}
        <textarea
          aria-label="Palabras bloqueadas"
          value={words ?? blocked.join("\n")}
          onChange={(e) => setWords(e.target.value)}
          rows={8}
          className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => saveWords.mutate()}
          disabled={saveWords.isPending || (blockedError && words === null)}
          className="mt-3 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
        >
          Guardar filtro
        </button>
      </section>
    </AppShell>
  );
}