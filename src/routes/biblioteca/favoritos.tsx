import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { ResourceCard } from "@/components/biblioteca/ResourceCard";
import { resourcesQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca/favoritos")({
  head: () => ({
    meta: [
      { title: "Mis favoritos — Biblioteca Digital" },
      { name: "description", content: "Materiales que guardaste como favoritos para encontrarlos rápido." },
      { property: "og:title", content: "Mis favoritos — Biblioteca Digital" },
      { property: "og:description", content: "Materiales guardados como favoritos." },
    ],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const navigate = useNavigate();
  const { student, teacher, ready, favorites, toggleFavorite } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const {
    data: resources = [],
    isError: resourcesError,
    refetch: refetchResources,
  } = useQuery(resourcesQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const favoriteResources = resources.filter((r) => favorites.includes(r.id));

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
          title="No pudimos cargar tus favoritos"
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

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
            <Heart className="size-6 text-accent" /> Mis favoritos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Los materiales que guardaste para volver a verlos rápido.
          </p>
        </div>

        {favoriteResources.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Todavía no guardaste favoritos"
            description="Tocá el corazón en cualquier material para agregarlo a esta lista."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                subjectName={subjectByCode.get(r.subject_code)?.name}
                isFavorite
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
