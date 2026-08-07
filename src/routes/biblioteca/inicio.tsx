import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellRing, BookOpen, CalendarDays, Heart, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { ResourceCard } from "@/components/biblioteca/ResourceCard";
import { resourcesQuery, subjectsQuery, type Resource } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { KIND_FILTERS, KIND_LABELS, YEARS, scoreResource, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content: "Buscá materiales, mirá los destacados y accedé a tus materias por año escolar.",
      },
      { property: "og:title", content: "Inicio — Biblioteca Digital E.E.S. N.º 6" },
      { property: "og:description", content: "Buscador de materiales y materias por año escolar." },
    ],
  }),
  component: InicioAlumno,
});

function InicioAlumno() {
  const navigate = useNavigate();
  const { student, teacher, ready } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const { data: subjects = [] } = useQuery(subjectsQuery);
  const { data: resources = [] } = useQuery(resourcesQuery);

  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [kind, setKind] = useState<string | null>(null);

  const subjectByCode = useMemo(() => new Map(subjects.map((s) => [s.code, s])), [subjects]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return resources
      .map((r) => ({
        resource: r,
        score: scoreResource(r, query, subjectByCode.get(r.subject_code)?.name),
      }))
      .filter(
        (x) =>
          x.score > 0 &&
          (year === null || x.resource.year === year) &&
          (kind === null || x.resource.kind === kind),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map((x) => x.resource);
  }, [resources, query, year, kind, subjectByCode]);

  const featured = useMemo(
    () => resources.filter((r) => r.featured).slice(0, 6),
    [resources],
  );
  const recent = useMemo(() => resources.slice(0, 6), [resources]);

  const [subjectsYear, setSubjectsYear] = useState<number>(YEARS[0]);
  const subjectsForYear = subjects.filter((s) => s.year === subjectsYear);

  if (!ready || (!student && !teacher)) {
    return (
      <AppShell area="alumno">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-8">
        <section>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Hola, {student?.name ?? "estudiante"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buscá materiales de todas las materias o navegá por año.
          </p>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, tema, etiqueta, docente…"
                aria-label="Buscar materiales"
                className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setYear(null)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  year === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                Todos los años
              </button>
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    year === y
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {yearLabel(y)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setKind(null)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  kind === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                Todos los tipos
              </button>
              {KIND_FILTERS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    kind === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {query.trim() ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Resultados de búsqueda</h2>
            {searchResults.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={Search}
                  title="No encontramos materiales"
                  description="Probá con otras palabras clave o quitá los filtros aplicados."
                />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((r) => (
                  <ResourceCardLazy key={r.id} resource={r} subjectName={subjectByCode.get(r.subject_code)?.name} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Sparkles className="size-5 text-primary" /> Destacados
              </h2>
              {featured.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Todavía no hay materiales destacados.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((r) => (
                    <ResourceCardLazy
                      key={r.id}
                      resource={r}
                      subjectName={subjectByCode.get(r.subject_code)?.name}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold">Recientes</h2>
              {recent.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Todavía no hay materiales cargados.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recent.map((r) => (
                    <ResourceCardLazy
                      key={r.id}
                      resource={r}
                      subjectName={subjectByCode.get(r.subject_code)?.name}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">Materias</h2>
                <div className="flex flex-wrap gap-1.5">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setSubjectsYear(y)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        subjectsYear === y
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {yearLabel(y)}
                    </button>
                  ))}
                </div>
              </div>
              {subjectsForYear.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    icon={BookOpen}
                    title="No hay materias cargadas para este año"
                    description="Cuando el equipo docente cargue materias, van a aparecer acá."
                  />
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {subjectsForYear.map((s) => (
                    <a
                      key={s.code}
                      href={`/biblioteca/materia/${s.code}`}
                      className="card-lift flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
                    >
                      <BookOpen className="size-5 text-primary" />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{yearLabel(s.year)}</span>
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickLink to="/biblioteca/novedades" icon={BellRing} label="Novedades" />
              <QuickLink to="/biblioteca/calendario" icon={CalendarDays} label="Calendario" />
              <QuickLink to="/biblioteca/favoritos" icon={Heart} label="Favoritos" />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: typeof BellRing; label: string }) {
  return (
    <a
      href={to}
      className="card-lift flex items-center gap-3 rounded-xl border border-border bg-card p-4"
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="font-medium">{label}</span>
    </a>
  );
}

function ResourceCardLazy({ resource, subjectName }: { resource: Resource; subjectName?: string }) {
  const { favorites, toggleFavorite } = useBibliotecaSession();
  return (
    <ResourceCard
      resource={resource}
      subjectName={subjectName}
      isFavorite={favorites.includes(resource.id)}
      onToggleFavorite={toggleFavorite}
    />
  );
}
