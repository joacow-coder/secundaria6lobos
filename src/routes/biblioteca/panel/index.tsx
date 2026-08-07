import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BookOpen,
  CalendarDays,
  Download,
  Eye,
  FileText,
  Megaphone,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { announcementsQuery, calendarQuery, resourcesQuery, subjectMap, subjectsQuery } from "@/lib/biblioteca/data";
import { formatDate, KIND_LABELS } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/panel/")({
  head: () => ({
    meta: [
      { title: "Panel docente — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content: "Resumen de materiales, novedades y eventos publicados en la Biblioteca Digital.",
      },
      { property: "og:title", content: "Panel docente — Biblioteca Digital E.E.S. N.º 6" },
      {
        property: "og:description",
        content: "Panel de gestión docente de la Biblioteca Digital de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: PanelInicio,
});

const QUICK_LINKS = [
  { to: "/biblioteca/panel/recursos", label: "Nuevo material", icon: FileText },
  { to: "/biblioteca/panel/novedades", label: "Nueva novedad", icon: Megaphone },
  { to: "/biblioteca/panel/calendario", label: "Nuevo evento", icon: CalendarDays },
  { to: "/biblioteca/panel/administracion", label: "Administración", icon: Users },
  { to: "/biblioteca/asistente", label: "Asistente IA", icon: Sparkles },
  { to: "/biblioteca/panel/configuracion", label: "Configuración", icon: Settings },
] as const;

function PanelInicio() {
  const navigate = useNavigate();
  const { teacher, ready } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  const resourcesQ = useQuery(resourcesQuery);
  const announcementsQ = useQuery(announcementsQuery);
  const calendarQ = useQuery(calendarQuery);
  const subjectsQ = useQuery(subjectsQuery);

  if (!ready || !teacher) {
    return (
      <AppShell area="profesor">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const resources = resourcesQ.data ?? [];
  const announcements = announcementsQ.data ?? [];
  const events = calendarQ.data ?? [];
  const subjects = subjectMap(subjectsQ.data ?? []);

  const totalViews = resources.reduce((acc, r) => acc + (r.views ?? 0), 0);
  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloads ?? 0), 0);
  const upcomingEvents = events.filter((e) => new Date(e.starts_at) >= new Date()).length;

  const stats = [
    { label: "Materiales publicados", value: resources.length, icon: FileText },
    { label: "Vistas totales", value: totalViews, icon: Eye },
    { label: "Descargas totales", value: totalDownloads, icon: Download },
    { label: "Novedades", value: announcements.length, icon: Megaphone },
    { label: "Próximos eventos", value: upcomingEvents, icon: CalendarDays },
  ];

  return (
    <AppShell area="profesor">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Hola, {teacher.full_name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este es el resumen de la Biblioteca Digital institucional.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="card-lift rounded-xl border border-border bg-card p-4 shadow-soft">
              <stat.icon className="size-5 text-primary" />
              <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.to}
                href={link.to}
                className="card-lift flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-soft transition-colors hover:bg-secondary/50"
              >
                <link.icon className="size-5 text-primary" />
                <span className="text-xs font-medium text-foreground">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Últimos materiales</h2>
              <a href="/biblioteca/panel/recursos" className="text-sm text-primary hover:underline">
                Ver todos
              </a>
            </div>
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay materiales publicados.</p>
            ) : (
              <ul className="space-y-2">
                {resources.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{r.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {subjects.get(r.subject_code)?.name ?? r.subject_code} · {r.year}° año ·{" "}
                        {KIND_LABELS[r.kind] ?? r.kind}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Últimas novedades</h2>
              <a href="/biblioteca/panel/novedades" className="text-sm text-primary hover:underline">
                Ver todas
              </a>
            </div>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay novedades publicadas.</p>
            ) : (
              <ul className="space-y-2">
                {announcements.slice(0, 5).map((a) => (
                  <li key={a.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <p className="truncate font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
