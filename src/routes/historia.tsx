import { createFileRoute } from "@tanstack/react-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppBottomNav } from "@/components/AppBottomNav";
import { loadSiteContent } from "@/lib/site.functions";
import type { SiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/historia")({
  loader: () => loadSiteContent(),
  head: () => ({
    meta: [
      { title: "Historia de la Escuela — EES N.º 6 Lobos" },
      {
        name: "description",
        content:
          "Línea de tiempo de la Escuela de Educación Secundaria N.º 6 de Lobos: creación en 2006, conformación institucional en 2014 y su edificio de San Martín 57.",
      },
      { property: "og:title", content: "Historia de la Escuela — EES N.º 6 Lobos" },
      {
        property: "og:description",
        content: "Recorrido histórico de la EES N.º 6 de Lobos en una línea de tiempo.",
      },
    ],
  }),
  component: HistoriaScreen,
});

function HistoriaScreen() {
  const { history } = Route.useLoaderData() as SiteContent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader eyebrow="Nuestra Escuela" title="Historia de la Escuela" description={history.intro} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <ol className="relative space-y-6 border-l-2 border-brand-sky/60 pl-6">
          {history.timeline.map((t) => (
            <li key={t.date + t.title} className="relative">
              <span className="absolute -left-[34px] top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-navy text-[10px] font-bold text-primary-foreground ring-4 ring-background">
                ●
              </span>
              <div className="rounded-2xl bg-card p-5 shadow-card">
                <div className="text-xs font-bold tracking-widest uppercase text-brand-sky">{t.date}</div>
                <h2 className="mt-1 text-lg font-bold text-brand-navy">{t.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{t.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-3xl bg-brand-sky/20 p-6 text-center text-brand-navy shadow-card">
          <p className="text-base leading-relaxed font-medium">{history.closing}</p>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}
