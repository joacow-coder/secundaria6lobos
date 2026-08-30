import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { noticiasQuery, formatFecha } from "@/lib/futuro/data";

export const Route = createFileRoute("/tu-futuro/noticias")({
  head: () => ({
    meta: [
      { title: "Noticias | Orientación Estudiantil EES N.º 6" },
      {
        name: "description",
        content: "Información publicada y verificada por el equipo de orientación de la escuela.",
      },
    ],
  }),
  component: NoticiasPage,
});

function NoticiasPage() {
  const { data, isLoading, isError, refetch } = useQuery(noticiasQuery);
  const noticias = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Novedades"
        title="Lo último de orientación"
        description="Información publicada y verificada por el equipo de orientación de la escuela."
      />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {isLoading && !isError && (
          <p className="text-sm text-muted-foreground">Cargando novedades…</p>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          {!isError &&
            noticias.map((n) => (
            <article
              key={n.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              {n.imagen_url && (
                <img
                  src={n.imagen_url}
                  alt={n.titulo}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs text-muted-foreground">{formatFecha(n.fecha_publicacion)}</p>
                <h2 className="mt-2 font-display text-lg font-semibold leading-snug">
                  {n.titulo}
                </h2>
                {n.resumen && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {n.resumen}
                  </p>
                )}
                {n.contenido && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {n.contenido}
                  </p>
                )}
                {n.enlace && (
                  <a
                    href={n.enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-primary hover:underline"
                  >
                    Leer más <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {isError ? (
          <EmptyState
            icon={WifiOff}
            title="No pudimos cargar las novedades"
            description="Revisá tu conexión a internet y volvé a intentar."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Reintentar
              </button>
            }
          />
        ) : (
          !isLoading &&
          noticias.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Todavía no hay novedades publicadas.</p>
            </div>
          )
        )}
      </section>
    </>
  );
}
