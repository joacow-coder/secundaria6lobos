import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  ClipboardList,
  Heart,
  LayoutDashboard,
  Megaphone,
  Menu,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: LucideIcon };

const ALUMNO_ITEMS: NavItem[] = [
  { to: "/biblioteca/inicio", label: "Inicio", icon: LayoutDashboard },
  { to: "/biblioteca/favoritos", label: "Favoritos", icon: Heart },
  { to: "/biblioteca/notificaciones", label: "Avisos", icon: Bell },
  { to: "/biblioteca/perfil", label: "Perfil", icon: UserRound },
];

const PROFESOR_ITEMS: NavItem[] = [
  { to: "/biblioteca/panel", label: "Panel", icon: LayoutDashboard },
  { to: "/biblioteca/panel/recursos", label: "Materiales", icon: BookOpen },
  { to: "/biblioteca/panel/comunicados", label: "Comunicados", icon: Megaphone },
  { to: "/biblioteca/notificaciones", label: "Avisos", icon: Bell },
];

const STAFF_ITEMS: NavItem[] = [
  { to: "/biblioteca/panel/comunicados", label: "Comunicados", icon: Megaphone },
  { to: "/biblioteca/panel/recursos", label: "Materiales", icon: BookOpen },
  { to: "/biblioteca/notificaciones", label: "Avisos", icon: Bell },
  { to: "/biblioteca/panel/administracion", label: "Admin.", icon: ClipboardList },
];

/**
 * Barra de navegación inferior de la Biblioteca Digital, estilo app nativa:
 * solo los 4 accesos más usados por rol + "Más" (que abre el mismo drawer
 * de AppShell con el resto de las secciones, sin duplicar nada). Reemplaza,
 * en mobile, al menú hamburguesa como forma principal de navegar — el header
 * de arriba queda liviano (logo + usuario + salir).
 */
export function BottomNav({
  role,
  onMore,
}: {
  role: "alumno" | "profesor" | "preceptor" | "directivo";
  onMore: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items =
    role === "alumno" ? ALUMNO_ITEMS : role === "profesor" ? PROFESOR_ITEMS : STAFF_ITEMS;

  return (
    <>
      <div className="h-[4.5rem] lg:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? "text-brand-navy" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`size-5 ${active ? "" : "opacity-80"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={onMore}
              className="flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors"
            >
              <Menu className="size-5 opacity-80" />
              <span className="truncate">Más</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
