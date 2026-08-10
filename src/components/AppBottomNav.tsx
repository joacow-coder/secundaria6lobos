import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BookOpen, Home, Info, Menu } from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };

const ITEMS: NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/biblioteca/novedades", label: "Avisos", icon: Bell, exact: true },
  { to: "/institucion", label: "Institución", icon: Info },
  { to: "/mas", label: "Más", icon: Menu },
];

/** Barra de navegación inferior (experiencia tipo app en celulares). */
export function AppBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
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
        </ul>
      </nav>
    </>
  );
}
