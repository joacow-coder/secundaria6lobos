import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Lock, Search, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { ResourceCard } from "@/components/biblioteca/ResourceCard";
import { resourcesQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import {
  isCurrentSchoolYear,
  KIND_FILTERS,
  KIND_LABELS,
  scoreResource,
  yearLabel,
} from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/materia/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Materia ${params.code} — Biblioteca Digital` },
      { name: "description", content: "Materiales de la materia organizados por unidad." },
      { property: "og:title", content: `Materia ${params.code} — Biblioteca Digital` },
      { property: "og:description", content: "Materiales de la materia organizados por unidad." },
    ],
  }),
  component: MateriaPage,
});

function MateriaPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { student, teacher, ready, favorites, toggleFavorite } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const { data: subjects = [] } = useQuery(subjectsQuery);
  const {
    data: resources = [],
    isLoading: resourcesLoading,
    isError: resourcesError,
    refetch: refetchResources,
  } = useQuery(resourcesQuery);

  const subject = subjects.find((s) => s.code === code);
  const blockedByYear = Boolean(student && subject && subject.year !== student.year);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);

  const subjectResources = useMemo(() => {
    return resources
      .filter((r) => r.subject_code === code)
      .filter((r) => showHistorical || isCurrentSchoolYear(r.created_at))
      .filter((r) => kind === null || r.kind === kind)
      .filter((r) => (query.trim() ? scoreResource(r, query, subject?.name) > 0 : true));
  }, [resources, code, kind, query, subject, showHistorical]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof subjectResources>();
    for (const r of subjectResources) {
      const key = r.unit?.trim() || "Sin unidad";
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [subjectResources]);

  if (!ready || (!student && !teacher)) {
    return (
      <AppShell area="alumno">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  if (resourcesError) {
    return (
      <AppShell area="alumno">
        <EmptyState
          icon={WifiOff}
          title="No pudimos cargar los materiales"
          description="Revisá tu conexión a internet y volvé a intentar."
          action={
            <button
              type="button"
              onClick={() => refetchResources()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Reintentar
            </button>
          }
        />
      </AppShell>
    );
  }

  if (blockedByYear) {
    return (
      <AppShell area="alumno">
        <EmptyState
          icon={Lock}
          title="Esta materia no es de tu año"
          description="Solo podés ver los materiales del año con el que ingresaste a la biblioteca."
          action={
            <a
              href="/biblioteca/inicio"
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Volver a inicio
            </a>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-6">
        <div>
          <a href="/biblioteca/inicio" className="text-sm text-primary hover:underline">
            ← Volver a inicio
          </a>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold">{subject?.name ?? code}</h1>
              <p className="text-sm text-muted-foreground">
                {subject ? yearLabel(subject.year) : "Materia"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar dentro de la materia…"
              aria-label="Buscar materiales de la materia"
              className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
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

        <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={(e) => setShowHistorical(e.target.checked)}
            className="size-4"
          />
          Ver material de años anteriores
        </label>

        {resourcesLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-secondary" />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No hay materiales disponibles"
            description="Todavía no se cargaron materiales para esta materia o filtro."
          />
        ) : (
          groups.map(([unit, items]) => (
            <section key={unit}>
              <h2 className="font-display text-lg font-semibold">{unit}</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    subjectName={subject?.name}
                    isFavorite={favorites.includes(r.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
