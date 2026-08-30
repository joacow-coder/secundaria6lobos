import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Globe,
  Heart,
  Mail,
  MapPin,
  Route as RouteIcon,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { LeafletMap } from "@/components/LeafletMap";
import { carrerasQuery, formatDistancia, institucionesQuery } from "@/lib/futuro/data";
import { labelTipoInstitucion } from "@/lib/futuro/site";
import { registrarVisitaInstitucion, toggleFavoritoInstitucion, useMemoria } from "@/lib/futuro/store";

function esUrlValida(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function coordsValidas(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
}

function InstitucionDetalle() {
  const { id } = Route.useParams();
  const institucionesQ = useQuery(institucionesQuery);
  const carrerasQ = useQuery(carrerasQuery);
  const memoria = useMemoria();

  const institucion = (institucionesQ.data ?? []).find((i) => i.id === id);
  const carreras = (carrerasQ.data ?? []).filter((c) => c.institucion_id === id);
  const esFavorita = memoria.favoritosInstituciones.some((f) => f.id === id);
  const sitioOficial = esUrlValida(institucion?.sitio_oficial) ? institucion.sitio_oficial : null;
  const tieneCoords = coordsValidas(institucion?.lat ?? null, institucion?.lng ?? null);
  const sinDatos =
    !!institucion &&
    !sitioOficial &&
    !institucion.contacto &&
    !institucion.direccion &&
    !institucion.descripcion &&
    !tieneCoords;

  useEffect(() => {
    if (institucion) registrarVisitaInstitucion({ id: institucion.id, nombre: institucion.nombre, detalle: institucion.ciudad ?? undefined });
  }, [institucion]);

  if (institucionesQ.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm text-muted-foreground">Cargando ficha…</p>
      </div>
    );
  }

  if (institucionesQ.isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <EmptyState
          icon={WifiOff}
          title="No pudimos cargar esta institución"
          description="Revisá tu conexión a internet y volvé a intentar."
          action={
            <button
              type="button"
              onClick={() => institucionesQ.refetch()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Reintentar
            </button>
          }
        />
      </div>
    );
  }

  if (!institucion) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold">No encontramos esta institución</h1>
        <Link to="/tu-futuro/instituciones" className="mt-4 inline-block text-sm text-primary hover:underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="relative border-b border-border">
        <div className="h-56 w-full overflow-hidden bg-muted sm:h-72">
          {institucion.imagen_url ? (
            <img src={institucion.imagen_url} alt={`Imagen de ${institucion.nombre}`} className="h-full w-full object-cover" />
          ) : (
            <div className="hero-gradient h-full w-full" />
          )}
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link
            to="/tu-futuro/instituciones"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Instituciones
          </Link>
          <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
            {labelTipoInstitucion(institucion.tipo)}
          </p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-3xl font-bold sm:text-4xl">{institucion.nombre}</h1>
            <button
              type="button"
              aria-pressed={esFavorita}
              onClick={() =>
                toggleFavoritoInstitucion({ id: institucion.id, nombre: institucion.nombre, detalle: institucion.ciudad ?? undefined })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Heart className={esFavorita ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
              {esFavorita ? "Guardada" : "Guardar"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {institucion.ciudad} · {formatDistancia(institucion.distancia_km)} · Actualizado en{" "}
            {institucion.anio_actualizacion}
          </p>
        </div>
      </section>

      {sinDatos && (
        <div className="border-b border-border bg-accent/40">
          <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-accent-foreground sm:px-6">
            Estamos actualizando la información de esta institución. Consultá con el equipo de orientación de la
            escuela mientras tanto.
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div>
          {institucion.descripcion && (
            <p className="text-base leading-relaxed text-muted-foreground">{institucion.descripcion}</p>
          )}

          {institucion.historia && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Sobre la institución</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{institucion.historia}</p>
            </div>
          )}

          {institucion.info_inscripcion && (
            <div className="mt-8 rounded-xl border border-border bg-accent/40 p-6">
              <h2 className="text-base font-bold">Cómo inscribirse</h2>
              <p className="mt-2 text-sm leading-relaxed text-accent-foreground/90">{institucion.info_inscripcion}</p>
            </div>
          )}

          {institucion.como_llegar && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <RouteIcon className="h-4 w-4 text-primary" /> Cómo llegar desde Lobos
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{institucion.como_llegar}</p>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-xl font-bold">Carreras disponibles ({carreras.length})</h2>
            <div className="mt-5 grid gap-3">
              {carreras.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold text-accent-foreground">
                      {c.area}
                    </span>
                    {c.duracion && <span className="text-xs text-muted-foreground">{c.duracion}</span>}
                    {c.modalidad && <span className="text-xs text-muted-foreground">· {c.modalidad}</span>}
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold">{c.nombre}</h3>
                  {c.descripcion && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.descripcion}</p>
                  )}
                  {esUrlValida(c.enlace_oficial) && (
                    <a
                      href={c.enlace_oficial}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Plan de estudios <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
              {carrerasQ.isError ? (
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  No pudimos cargar las carreras de esta institución.
                  <button
                    type="button"
                    onClick={() => carrerasQ.refetch()}
                    className="font-medium text-primary hover:underline"
                  >
                    Reintentar
                  </button>
                </p>
              ) : (
                carreras.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Todavía no cargamos carreras para esta institución: la información está en proceso de
                    actualización.
                    {sitioOficial ? " Mientras tanto podés consultar el sitio oficial." : ""}
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-bold">Datos de contacto</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {institucion.direccion && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{institucion.direccion}</span>
                </li>
              )}
              {institucion.contacto && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="break-words text-muted-foreground">{institucion.contacto}</span>
                </li>
              )}
              {sitioOficial && (
                <li className="flex gap-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <a href={sitioOficial} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                    {sitioOficial.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
            </ul>

            {!institucion.direccion && !institucion.contacto && !sitioOficial && (
              <p className="mt-3 text-sm text-muted-foreground">
                Estamos actualizando la información de esta institución. Consultá con el equipo de orientación de la
                escuela mientras tanto.
              </p>
            )}

            {sitioOficial && (
              <a
                href={sitioOficial}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-semibold hover:bg-muted"
              >
                Ver sitio oficial <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}

            {tieneCoords && (
              <a
                href={`https://www.openstreetmap.org/directions?to=${institucion.lat}%2C${institucion.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Cómo llegar
              </a>
            )}
          </div>

          {tieneCoords ? (
            <LeafletMap
              markers={[
                {
                  id: institucion.id,
                  lat: Number(institucion.lat),
                  lng: Number(institucion.lng),
                  label: institucion.nombre,
                  sublabel: institucion.ciudad ?? undefined,
                  variant: "primary",
                },
              ]}
              zoom={14}
              height={300}
              ariaLabel={`Mapa de ${institucion.nombre}`}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
              Todavía no tenemos la ubicación exacta de esta institución. Estamos actualizando el mapa.
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/instituciones/$id")({
  head: () => ({
    meta: [{ title: "Ficha de institución" }],
  }),
  component: InstitucionDetalle,
});
