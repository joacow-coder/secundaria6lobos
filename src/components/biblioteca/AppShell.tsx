import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

const STUDENT_NAV = [
  { to: "/biblioteca/inicio", label: "Inicio" },
  { to: "/biblioteca/favoritos", label: "Favoritos" },
  { to: "/biblioteca/novedades", label: "Novedades" },
  { to: "/biblioteca/notificaciones", label: "Notificaciones" },
  { to: "/biblioteca/calendario", label: "Calendario" },
  { to: "/biblioteca/asistente", label: "Asistente" },
  { to: "/biblioteca/perfil", label: "Mi perfil" },
] as const;

const TEACHER_NAV = [
  { to: "/biblioteca/panel", label: "Panel" },
  { to: "/biblioteca/panel/recursos", label: "Mis materiales" },
  { to: "/biblioteca/panel/comunicados", label: "Comunicados" },
  { to: "/biblioteca/notificaciones", label: "Notificaciones" },
  { to: "/biblioteca/panel/novedades", label: "Novedades" },
  { to: "/biblioteca/panel/calendario", label: "Calendario" },
  { to: "/biblioteca/asistente", label: "Asistente" },
  { to: "/biblioteca/panel/administracion", label: "Administración" },
  { to: "/biblioteca/panel/configuracion", label: "Configuración" },
] as const;

const STAFF_NAV = [
  { to: "/biblioteca/panel/comunicados", label: "Comunicados" },
  { to: "/biblioteca/notificaciones", label: "Notificaciones" },
  { to: "/biblioteca/novedades", label: "Novedades" },
  { to: "/biblioteca/calendario", label: "Calendario" },
] as const;

export function AppShell({
  children,
  area,
}: {
  children: ReactNode;
  area: "alumno" | "profesor";
}) {
  const { student, teacher, signOut } = useBibliotecaSession();
  const [open, setOpen] = useState(false);

  const links: readonly { to: string; label: string }[] =
    area === "alumno"
      ? STUDENT_NAV
      : teacher && teacher.role !== "profesor"
        ? STAFF_NAV
        : TEACHER_NAV;
  const displayName = area === "alumno" ? student?.name : (teacher?.full_name ?? "Administración");
  const initials = (displayName ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");

  function handleExit() {
    signOut();
    window.location.href = area === "profesor" ? "/biblioteca/acceso" : "/biblioteca";
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="surface-institutional sticky top-0 z-40 text-primary-foreground shadow-soft">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
          <a
            href={
              area === "alumno"
                ? "/biblioteca/inicio"
                : teacher && teacher.role !== "profesor"
                  ? "/biblioteca/panel/comunicados"
                  : "/biblioteca/panel"
            }
            className="flex min-w-0 items-center gap-3"
          >
            <img
              src={logoAsset.url}
              alt="Escudo de la Escuela de Educación Secundaria N.º 6"
              className="size-11 shrink-0 rounded-full bg-white/95 p-1 shadow-soft"
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-base leading-tight font-semibold sm:text-lg">
                Biblioteca Digital
              </span>
              <span className="block truncate text-[11px] tracking-wide uppercase opacity-80 sm:text-xs">
                E.E.S. N.º 6 · Lobos
              </span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-1">
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((item) => (
                <a
                  key={item.to}
                  href={item.to}
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-2 pl-2 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/15 text-xs">
                {initials || "?"}
              </span>
              <span className="max-w-[9rem] truncate text-sm">{displayName ?? "Visitante"}</span>
            </div>

            <button
              type="button"
              onClick={handleExit}
              aria-label="Salir"
              className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-white/10"
            >
              <LogOut className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-white/10 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute top-0 right-0 flex h-full w-72 flex-col gap-1 bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2">
              <p className="truncate px-1 text-sm text-muted-foreground">{displayName}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            {links.map((item) => (
              <a
                key={item.to}
                href={item.to}
                className="rounded-md px-3 py-2.5 text-base transition-colors hover:bg-secondary"
              >
                {item.label}
              </a>
            ))}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Escuela de Educación Secundaria N.º 6 · Lobos, Buenos Aires</p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/biblioteca/asistente"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <Sparkles className="size-4" /> Asistente de la biblioteca
            </a>
            <a href="/" className="hover:text-foreground">
              Volver al sitio de la escuela
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}