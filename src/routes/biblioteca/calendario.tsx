import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Clock, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { calendarQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { EVENT_TYPES, YEARS, formatDate, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — Biblioteca Digital E.E.S. N.º 6" },
      { name: "description", content: "Fechas importantes, evaluaciones y eventos institucionales." },
      { property: "og:title", content: "Calendario — Biblioteca Digital E.E.S. N.º 6" },
      { property: "og:description", content: "Próximas fechas y eventos escolares." },
    ],
  }),
  component: CalendarioPage,
});

function CalendarioPage() {
  const navigate = useNavigate();
  const { student, teacher, ready } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const { data: events = [], isError: eventsError, refetch: refetchEvents } = useQuery(calendarQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const [year, setYear] = useState<number | null>(null);
  const [subjectCode, setSubjectCode] = useState<string | null>(null);

  const now = Date.now();

  const filtered = useMemo(
    () =>
      events
        .filter(
          (e) =>
            (year === null || e.year === null || e.year === year) &&
            (subjectCode === null || e.subject_code === null || e.subject_code === subjectCode),
        )
        .filter((e) => new Date(e.starts_at).getTime() >= now - 1000 * 60 * 60 * 24)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [events, year, subjectCode, now],
  );

  const next7 = filtered.filter(
    (e) => new Date(e.starts_at).getTime() <= now + 1000 * 60 * 60 * 24 * 7,
  );

  const byMonth = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const key = new Date(e.starts_at).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (!ready || (!student && !teacher)) {
    return (
      <AppShell area="alumno">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  if (eventsError) {
    return (
      <AppShell area="alumno">
        <EmptyState
          icon={WifiOff}
          title="No pudimos cargar el calendario"
          description="Revisá tu conexión a internet y volvé a intentar."
          action={
            <button
              type="button"
              onClick={() => refetchEvents()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Reintentar
            </button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <CalendarDays className="size-6 text-primary" /> Calendario
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Próximas fechas y eventos escolares.</p>
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

        {next7.length > 0 ? (
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary">
              <Clock className="size-4" /> Próximos 7 días
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {next7.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatDate(e.starts_at)}</span>
                  <span>{e.title}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {byMonth.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No hay eventos próximos"
            description="Cuando el equipo docente cargue fechas, van a aparecer acá."
          />
        ) : (
          byMonth.map(([month, items]) => (
            <section key={month}>
              <h2 className="font-display text-lg font-semibold capitalize">{month}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {items.map((e) => (
                  <article key={e.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {EVENT_TYPES[e.event_type] ?? e.event_type}
                      </span>
                      {e.subject_code ? (
                        <span className="text-xs text-muted-foreground">
                          {subjectByCode.get(e.subject_code)?.name ?? e.subject_code}
                        </span>
                      ) : null}
                      {e.year ? <span className="text-xs text-muted-foreground">· {yearLabel(e.year)}</span> : null}
                    </div>
                    <h3 className="mt-1.5 font-medium">{e.title}</h3>
                    {e.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(e.starts_at)}
                      {e.ends_at ? ` – ${formatDate(e.ends_at)}` : ""} · {e.teacher_name}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
