import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart, History, LogOut, UserRound } from "lucide-react";
import { useEffect } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { resourcesQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { formatDate } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — Biblioteca Digital E.E.S. N.º 6" },
      { name: "description", content: "Tus datos, favoritos y materiales vistos recientemente." },
      { property: "og:title", content: "Mi perfil — Biblioteca Digital E.E.S. N.º 6" },
      { property: "og:description", content: "Tus favoritos y materiales vistos recientemente." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const { student, teacher, ready, favorites, recents, signOut } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const { data: resources = [] } = useQuery(resourcesQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const recentResources = recents
    .map((id) => resources.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  if (!ready || (!student && !teacher)) {
    return (
      <AppShell area="alumno">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  function handleSignOut() {
    signOut();
    navigate({ to: "/biblioteca" });
  }

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-7" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold sm:text-2xl">{student?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Estudiante desde {formatDate(student?.since)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/70"
          >
            <LogOut className="size-4" /> Salir
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-soft">
            <Heart className="mx-auto size-5 text-accent" />
            <p className="mt-1 text-2xl font-bold">{favorites.length}</p>
            <p className="text-xs text-muted-foreground">Favoritos</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-soft">
            <History className="mx-auto size-5 text-primary" />
            <p className="mt-1 text-2xl font-bold">{recents.length}</p>
            <p className="text-xs text-muted-foreground">Vistos recientemente</p>
          </div>
        </div>

        <section>
          <h2 className="font-display text-lg font-semibold">Vistos recientemente</h2>
          {recentResources.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={History}
                title="Todavía no viste materiales"
                description="Los materiales que abras van a aparecer acá."
              />
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {recentResources.map((r) => (
                <li key={r.id}>
                  <a
                    href={`/biblioteca/recurso/${r.id}`}
                    className="card-lift flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {subjectByCode.get(r.subject_code)?.name ?? r.subject_code}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
