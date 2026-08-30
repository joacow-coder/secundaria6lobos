import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { recursosQuery } from "@/lib/futuro/data";

export const Route = createFileRoute("/tu-futuro/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos | Orientación Estudiantil EES N.º 6" },
      {
        name: "description",
        content:
          "Todo lo que conviene tener a mano: documentación, trámites, consejos para mudarse a estudiar y contactos de apoyo.",
      },
    ],
  }),
  component: RecursosPage,
});

function RecursosPage() {
  const { data, isLoading, isError, refetch } = useQuery(recursosQuery);
  const recursos = data ?? [];
  const categorias = Array.from(new Set(recursos.map((r) => r.categoria)));

  return (
    <>
      <PageHeader
        eyebrow="Recursos"
        title="Guías prácticas para dar el próximo paso"
        description="Todo lo que conviene tener a mano: documentación, trámites, consejos para mudarse a estudiar y contactos de apoyo."
      />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {isLoading && !isError && (
          <p className="text-sm text-muted-foreground">Cargando recursos…</p>
        )}
        <div className="grid gap-12">
          {!isError &&
            categorias.map((categoria) => (
            <div key={categoria}>
              <h2 className="font-display text-xl font-bold capitalize">{categoria}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {recursos
                  .filter((r) => r.categoria === categoria)
                  .map((r) => (
                    <article
                      key={r.id}
                      className="rounded-xl border border-border bg-card p-6"
                    >
                      <h3 className="font-display text-base font-semibold">{r.titulo}</h3>
                      {r.resumen && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {r.resumen}
                        </p>
                      )}
                      {r.contenido && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {r.contenido}
                        </p>
                      )}
                      {r.enlace && (
                        <a
                          href={r.enlace}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          Abrir recurso <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {isError ? (
          <EmptyState
            icon={WifiOff}
            title="No pudimos cargar los recursos"
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
          recursos.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Todavía no hay recursos publicados.</p>
            </div>
          )
        )}
      </section>
    </>
  );
}
