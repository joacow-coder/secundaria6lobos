import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca/panel/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Información del acceso docente y cierre de sesión en la Biblioteca Digital de la E.E.S. N.º 6 de Lobos.",
      },
      { property: "og:title", content: "Configuración — Biblioteca Digital" },
      {
        property: "og:description",
        content: "Acceso docente y sesión en la Biblioteca Digital de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const navigate = useNavigate();
  const { teacher, ready, signOut } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  if (!ready || !teacher) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <AppShell area="profesor">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Configuración</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sesión actual y modelo de acceso docente.</p>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">Sesión</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Nombre para mostrar</dt>
            <dd className="font-medium">{teacher.full_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Perfil</dt>
            <dd className="font-medium">Equipo docente</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => {
            signOut();
            navigate({ to: "/biblioteca/acceso" });
          }}
          className="mt-4 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
        >
          Cerrar sesión
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldCheck className="size-5" /> Acceso institucional
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El ingreso docente funciona con un único código maestro institucional, válido en toda la
          plataforma. El código se valida en el servidor y no se muestra en pantalla. Si necesitás
          cambiarlo, pedilo al equipo directivo.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          La estructura de acceso ya está preparada para migrar a usuarios y contraseñas en el
          futuro sin rehacer las pantallas.
        </p>
      </section>
    </AppShell>
  );
}