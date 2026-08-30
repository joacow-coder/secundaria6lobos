import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Heart, MapPin, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { EmptyState as ErrorState } from "@/components/biblioteca/EmptyState";
import { institucionesQuery, formatDistancia } from "@/lib/futuro/data";
import { TIPOS_INSTITUCION, labelTipoInstitucion } from "@/lib/futuro/site";
import { useMemoria, toggleFavoritoInstitucion } from "@/lib/futuro/store";

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
      {mensaje}
    </div>
  );
}

function InstitucionesPage() {
  const { data, isLoading, isError, refetch } = useQuery(institucionesQuery);
  const [tipo, setTipo] = useState<string | null>(null);
  const memoria = useMemoria();
  const instituciones = (data ?? []).filter((i) => !tipo || i.tipo === tipo);

  return (
    <>
      <PageHeader
        eyebrow="Instituciones"
        title="Dónde podés estudiar cerca de Lobos"
        description="Universidades nacionales, institutos superiores de formación docente y técnica, y centros de formación profesional con su información de contacto e inscripción."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTipo(null)}
            className={
              tipo === null
                ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                : "rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            Todas
          </button>
          {TIPOS_INSTITUCION.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(tipo === t.value ? null : t.value)}
              className={
                tipo === t.value
                  ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {!isError &&
            instituciones.map((i) => {
            const esFavorita = memoria.favoritosInstituciones.some((f) => f.id === i.id);
            return (
              <div key={i.id} className="relative">
                <button
                  type="button"
                  aria-label={esFavorita ? "Quitar de guardadas" : "Guardar institución"}
                  aria-pressed={esFavorita}
                  onClick={() => toggleFavoritoInstitucion({ id: i.id, nombre: i.nombre, detalle: i.ciudad ?? undefined })}
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 backdrop-blur hover:bg-muted"
                >
                  <Heart className={esFavorita ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                </button>

                <Link
                  to="/tu-futuro/instituciones/$id"
                  params={{ id: i.id }}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    {i.imagen_url ? (
                      <img
                        src={i.imagen_url}
                        alt={`Imagen de ${i.nombre}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="hero-gradient flex h-full w-full items-center justify-center">
                        <MapPin className="h-8 w-8 text-white/70" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                      {labelTipoInstitucion(i.tipo)}
                    </span>
                    <h2 className="mt-2 font-display text-base font-semibold leading-snug">{i.nombre}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {i.ciudad} · {formatDistancia(i.distancia_km)}
                    </p>
                    {i.descripcion && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{i.descripcion}</p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-primary">
                      Ver ficha
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {isError ? (
          <div className="mt-8">
            <ErrorState
              icon={WifiOff}
              title="No pudimos cargar las instituciones"
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
          </div>
        ) : (
          !isLoading &&
          instituciones.length === 0 && (
            <div className="mt-8">
              <EmptyState mensaje="Todavía no hay instituciones cargadas para este filtro." />
            </div>
          )
        )}
      </div>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/instituciones/")({
  head: () => ({
    meta: [
      { title: "Dónde podés estudiar cerca de Lobos" },
      {
        name: "description",
        content:
          "Universidades nacionales, institutos superiores de formación docente y técnica, y centros de formación profesional con su información de contacto e inscripción.",
      },
    ],
  }),
  component: InstitucionesPage,
});
