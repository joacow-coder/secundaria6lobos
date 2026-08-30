import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search, WifiOff, X } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { EmptyState as ErrorState } from "@/components/biblioteca/EmptyState";
import { carrerasQuery, formatDistancia } from "@/lib/futuro/data";
import { labelTipoInstitucion } from "@/lib/futuro/site";
import {
  useMemoria,
  toggleFavoritoCarrera,
  guardarFiltros,
  registrarBusqueda,
} from "@/lib/futuro/store";

const DURACIONES = [
  { value: "corta", label: "Hasta 3 años" },
  { value: "media", label: "4 a 5 años" },
  { value: "larga", label: "6 años o más" },
];

const DISTANCIAS = [
  { value: "lobos", label: "En Lobos" },
  { value: "cerca", label: "Hasta 100 km" },
  { value: "lejos", label: "Más de 100 km" },
];

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
      {mensaje}
    </div>
  );
}

function FiltroChip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        activo
          ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          : "rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}

function CarrerasPage() {
  const { data, isLoading, isError, refetch } = useQuery(carrerasQuery);
  const search = useSearch({ from: "/tu-futuro/carreras" });
  const memoria = useMemoria();
  const [q, setQ] = useState(search.q ?? "");
  const [area, setArea] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [distancia, setDistancia] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    if (hidratado) return;
    setHidratado(true);
    const filtros = memoria.filtros as
      | { q?: string; area?: string | null; duracion?: string | null; modalidad?: string | null; distancia?: string | null }
      | null;
    if (filtros) {
      if (!search.q && filtros.q) setQ(filtros.q);
      setArea(filtros.area ?? null);
      setDuracion(filtros.duracion ?? null);
      setModalidad(filtros.modalidad ?? null);
      setDistancia(filtros.distancia ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoria.filtros, hidratado, search.q]);

  useEffect(() => {
    if (!hidratado) return;
    const timeout = setTimeout(() => {
      guardarFiltros({ q, area, duracion, modalidad, distancia });
      registrarBusqueda(q);
    }, 700);
    return () => clearTimeout(timeout);
  }, [q, area, duracion, modalidad, distancia, hidratado]);

  const favoritos = new Set(memoria.favoritosCarreras.map((f) => f.id));
  const carreras = data ?? [];

  const areas = useMemo(
    () => Array.from(new Set(carreras.map((c) => c.area).filter(Boolean))).sort(),
    [carreras],
  );
  const modalidades = useMemo(
    () => Array.from(new Set(carreras.map((c) => c.modalidad).filter(Boolean))).sort(),
    [carreras],
  );

  const filtradas = carreras.filter((c) => {
    const texto =
      `${c.nombre} ${c.area} ${c.descripcion ?? ""} ${c.salidas_laborales ?? ""} ${c.instituciones?.nombre ?? ""}`.toLowerCase();
    if ((q && !texto.includes(q.toLowerCase())) || (area && c.area !== area) || (modalidad && c.modalidad !== modalidad))
      return false;
    if (duracion) {
      const anios = c.duracion_anios ?? 0;
      if (
        (duracion === "corta" && !(anios > 0 && anios <= 3)) ||
        (duracion === "media" && !(anios >= 4 && anios <= 5)) ||
        (duracion === "larga" && !(anios >= 6))
      )
        return false;
    }
    if (distancia) {
      const km = c.instituciones?.distancia_km ?? null;
      if (
        km === null ||
        (distancia === "lobos" && Number(km) !== 0) ||
        (distancia === "cerca" && !(Number(km) > 0 && Number(km) <= 100)) ||
        (distancia === "lejos" && !(Number(km) > 100))
      )
        return false;
    }
    return true;
  });

  const hayFiltros = q || area || duracion || modalidad || distancia;

  return (
    <>
      <PageHeader
        eyebrow="Buscador"
        title="Encontrá la carrera que se parece a vos"
        description="Explorá la oferta académica de universidades, institutos superiores y centros de formación profesional accesibles desde Lobos."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar carrera, institución o salida laboral…"
              className="w-full rounded-lg border border-input bg-background py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <p className="eyebrow">Área</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {areas.map((a) => (
                  <FiltroChip key={a} activo={area === a} onClick={() => setArea(area === a ? null : a)}>
                    {a}
                  </FiltroChip>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="eyebrow">Duración</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DURACIONES.map((d) => (
                    <FiltroChip
                      key={d.value}
                      activo={duracion === d.value}
                      onClick={() => setDuracion(duracion === d.value ? null : d.value)}
                    >
                      {d.label}
                    </FiltroChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="eyebrow">Modalidad</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {modalidades.map((m) => (
                    <FiltroChip key={m} activo={modalidad === m} onClick={() => setModalidad(modalidad === m ? null : m)}>
                      {m}
                    </FiltroChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="eyebrow">Distancia</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DISTANCIAS.map((d) => (
                    <FiltroChip
                      key={d.value}
                      activo={distancia === d.value}
                      onClick={() => setDistancia(distancia === d.value ? null : d.value)}
                    >
                      {d.label}
                    </FiltroChip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setArea(null);
                setDuracion(null);
                setModalidad(null);
                setDistancia(null);
              }}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {isError
            ? "No pudimos cargar las carreras"
            : isLoading
              ? "Cargando carreras…"
              : `${filtradas.length} carreras encontradas`}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {!isError &&
            filtradas.map((c) => (
            <article
              key={c.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold text-accent-foreground">
                  {c.area}
                </span>
                {c.modalidad && (
                  <span className="rounded-full border border-border px-3 py-1 text-[0.7rem] text-muted-foreground">
                    {c.modalidad}
                  </span>
                )}
                {c.duracion && (
                  <span className="rounded-full border border-border px-3 py-1 text-[0.7rem] text-muted-foreground">
                    {c.duracion}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={favoritos.has(c.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
                  aria-pressed={favoritos.has(c.id)}
                  onClick={() =>
                    toggleFavoritoCarrera({ id: c.id, nombre: c.nombre, detalle: c.instituciones?.nombre ?? undefined })
                  }
                  className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-primary"
                >
                  <Heart className={favoritos.has(c.id) ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                </button>
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold leading-snug">{c.nombre}</h2>

              {c.instituciones && (
                <Link
                  to="/tu-futuro/instituciones/$id"
                  params={{ id: c.instituciones.id }}
                  className="mt-1 text-sm font-medium text-primary hover:underline"
                >
                  {c.instituciones.nombre}
                </Link>
              )}

              {c.descripcion && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.descripcion}</p>
              )}

              {c.salidas_laborales && (
                <p className="mt-3 text-sm leading-relaxed">
                  <span className="font-semibold">Salidas laborales: </span>
                  <span className="text-muted-foreground">{c.salidas_laborales}</span>
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
                <span>
                  {c.instituciones ? labelTipoInstitucion(c.instituciones.tipo) : "Institución"} ·{" "}
                  {formatDistancia(c.instituciones?.distancia_km ?? null)}
                </span>
                {c.enlace_oficial && (
                  <a
                    href={c.enlace_oficial}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Plan de estudios oficial
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {isError ? (
          <div className="mt-5">
            <ErrorState
              icon={WifiOff}
              title="No pudimos cargar las carreras"
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
          filtradas.length === 0 && (
            <div className="mt-5">
              <EmptyState mensaje="No encontramos carreras con esos filtros. Probá quitando alguno o buscando por otra palabra." />
            </div>
          )
        )}
      </div>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/carreras")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Encontrá la carrera que se parece a vos" },
      {
        name: "description",
        content:
          "Explorá la oferta académica de universidades, institutos superiores y centros de formación profesional accesibles desde Lobos.",
      },
    ],
  }),
  component: CarrerasPage,
});
