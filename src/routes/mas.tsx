import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Images,
  Landmark,
  Mail,
  Newspaper,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppBottomNav } from "@/components/AppBottomNav";

export const Route = createFileRoute("/mas")({
  head: () => ({
    meta: [
      { title: "Más secciones — EES N.º 6 Lobos" },
      {
        name: "description",
        content:
          "Accedé a todas las secciones de la EES N.º 6: historia, institución, biblioteca digital, Tu Futuro, noticias, galería, eventos y contacto.",
      },
      { property: "og:title", content: "Más secciones — EES N.º 6 Lobos" },
      { property: "og:description", content: "Todas las secciones de la EES N.º 6 de Lobos." },
    ],
  }),
  component: MasScreen,
});

type Item = { label: string; desc: string; icon: typeof BookOpen; to?: string; href?: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Institucional",
    items: [
      { label: "Historia de la Escuela", desc: "Línea de tiempo institucional", icon: ScrollText, to: "/historia" },
      { label: "Institución", desc: "Misión, valores, horarios y contacto", icon: Landmark, to: "/institucion" },
      { label: "Noticias y comunicados", desc: "Últimas novedades", icon: Newspaper, href: "/#noticias" },
      { label: "Galería", desc: "Momentos de la comunidad", icon: Images, href: "/#galeria" },
      { label: "Eventos", desc: "Calendario institucional", icon: CalendarDays, href: "/#eventos" },
      { label: "Contacto", desc: "Cómo comunicarte con la escuela", icon: Mail, href: "/#contacto" },
    ],
  },
  {
    title: "Plataformas",
    items: [
      { label: "Biblioteca Digital", desc: "Materiales, novedades y calendario", icon: BookOpen, to: "/biblioteca" },
      { label: "Tu Futuro", desc: "Carreras, becas y orientación", icon: GraduationCap, to: "/tu-futuro" },
      { label: "Panel de administración", desc: "Solo personal autorizado", icon: ShieldCheck, to: "/admin" },
    ],
  },
];

function MasScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader
        eyebrow="Menú"
        title="Más secciones"
        description="Todas las pantallas de la aplicación institucional en un solo lugar."
      />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-sky">{group.title}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {group.items.map((item) => {
                const inner = (
                  <>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-sky/25 text-brand-navy">
                      <item.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-brand-navy">{item.label}</span>
                      <span className="block truncate text-sm text-muted-foreground">{item.desc}</span>
                    </span>
                  </>
                );
                const cls =
                  "flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant";
                return (
                  <li key={item.label}>
                    {item.to ? (
                      <Link to={item.to} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <a href={item.href} className={cls}>
                        {inner}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <AppBottomNav />
    </div>
  );
}
