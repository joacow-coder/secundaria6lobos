import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellRing, Pin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { announcementsQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { IMPORTANCE, YEARS, formatDate, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/novedades")({
  head: () => ({
    meta: [
      { title: "Novedades — Biblioteca Digital E.E.S. N.º 6" },
      { name: "description", content: "Avisos y novedades publicados por el equipo docente." },
      { property: "og:title", content: "Novedades — Biblioteca Digital E.E.S. N.º 6" },
      { property: "og:description", content: "Avisos y novedades del equipo docente." },
    ],
  }),
  component: NovedadesPage,
});

function NovedadesPage() {
  const navigate = useNavigate();
  const { student, teacher, ready } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const { data: announcements = [] } = useQuery(announcementsQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const [year, setYear] = useState<number | null>(null);
  const [subjectCode, setSubjectCode] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      announcements.filter(
        (a) =>
          (year === null || a.year === null || a.year === year) &&
          (subjectCode === null || a.subject_code === null || a.subject_code === subjectCode),
      ),
    [announcements, year, subjectCode],
  );

  if (!ready || (!student && !teacher)) {
    return (
      <AppShell area="alumno">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <BellRing className="size-6 text-primary" /> Novedades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Avisos del equipo docente.</p>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
          <select
            aria-label="Filtrar por año"
            value={year ?? ""}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los años</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {yearLabel(y)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por materia"
            value={subjectCode ?? ""}
            onChange={(e) => setSubjectCode(e.target.value || null)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas las materias</option>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={BellRing} title="No hay novedades" description="Todavía no se publicaron avisos." />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((a) => {
              const importance = IMPORTANCE[a.importance] ?? IMPORTANCE["normal"];
              return (
                <article
                  key={a.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned ? <Pin className="size-4 text-primary" aria-label="Fijado" /> : null}
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${importance.className}`}>
                      {importance.label}
                    </span>
                    {a.subject_code ? (
                      <span className="text-xs text-muted-foreground">
                        {subjectByCode.get(a.subject_code)?.name ?? a.subject_code}
                      </span>
                    ) : null}
                    {a.year ? (
                      <span className="text-xs text-muted-foreground">· {yearLabel(a.year)}</span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold">{a.title}</h2>
                  <p className="mt-1 text-sm text-foreground/90">{a.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {a.teacher_name} · {formatDate(a.created_at)}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
