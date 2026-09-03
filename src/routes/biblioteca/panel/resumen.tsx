import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { resourcesQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { downloadCsv } from "@/lib/csv-export";
import { formatDate, formatFileSize, kindFromFilename, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/panel/resumen")({
  head: () => ({
    meta: [
      { title: "Resumen del año — Panel Biblioteca Digital" },
      {
        name: "description",
        content: "Resumen de los materiales subidos en el año lectivo, con exportación a CSV.",
      },
    ],
  }),
  component: ResumenPage,
});

function ResumenPage() {
  const navigate = useNavigate();
  const { teacher, ready } = useBibliotecaSession();
  const { data: resources = [] } = useQuery(resourcesQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const subjectName = new Map(subjects.map((s) => [s.code, s.name]));

  const years = useMemo(
    () => Array.from(new Set(resources.map((r) => new Date(r.created_at).getFullYear()))).sort(
      (a, b) => b - a,
    ),
    [resources],
  );
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  const isDirector = teacher?.role === "directivo";

  const rows = useMemo(
    () =>
      resources
        .filter((r) => new Date(r.created_at).getFullYear() === schoolYear)
        .filter((r) => isDirector || r.teacher_name === teacher?.full_name)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [resources, schoolYear, isDirector, teacher?.full_name],
  );

  if (!ready || !teacher) {
    return (
      <AppShell area="profesor">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  function exportCsv() {
    downloadCsv(
      rows.map((r) => ({
        título: r.title,
        materia: subjectName.get(r.subject_code) ?? r.subject_code,
        año: yearLabel(r.year),
        tipo: r.kind || kindFromFilename(r.title),
        tamaño: r.file_size ? formatFileSize(r.file_size) : "",
        autor: r.teacher_name,
        fecha: formatDate(r.created_at),
        enlace: r.external_url ?? "",
      })),
      `materiales-${schoolYear}${isDirector ? "" : `-${teacher?.full_name}`}.csv`,
    );
  }

  return (
    <AppShell area="profesor">
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
              <FileText className="size-6 text-primary" /> Resumen del año
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDirector
                ? "Todo lo subido por el equipo docente en el año lectivo elegido."
                : "Lo que subiste vos en el año lectivo elegido — útil antes del cierre de ciclo."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Año lectivo"
              value={schoolYear}
              onChange={(e) => setSchoolYear(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              {(years.length > 0 ? years : [schoolYear]).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Download className="size-4" /> Exportar CSV
            </button>
          </div>
        </header>

        {rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nada subido en ese año"
            description="Cuando cargues materiales, van a aparecer acá agrupados por año lectivo."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                <p className="truncate font-medium text-foreground">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {subjectName.get(r.subject_code) ?? r.subject_code} · {yearLabel(r.year)}
                </p>
                {isDirector ? (
                  <p className="mt-1 text-xs text-muted-foreground">{r.teacher_name}</p>
                ) : null}
                <p className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.file_size ? formatFileSize(r.file_size) : "Enlace"}</span>
                  <span>{formatDate(r.created_at)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
