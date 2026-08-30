import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/futuro/Layout";
import { LeafletMap, type MapMarker } from "@/components/LeafletMap";
import { institucionesQuery, formatDistancia, type Institucion } from "@/lib/futuro/data";
import { labelTipoInstitucion, LOBOS } from "@/lib/futuro/site";

function MapaInstituciones({
  instituciones,
  onSelect,
  height = 460,
}: {
  instituciones: Institucion[];
  onSelect?: (institucion: Institucion) => void;
  height?: number;
}) {
  const markers: MapMarker[] = [
    { id: "escuela", lat: LOBOS.lat, lng: LOBOS.lng, label: "EES N.º 6 — Lobos", variant: "primary" },
    ...instituciones
      .filter((i) => i.lat !== null && i.lng !== null)
      .map((i) => ({
        id: i.id,
        lat: Number(i.lat),
        lng: Number(i.lng),
        label: i.nombre,
        sublabel: i.ciudad ?? undefined,
      })),
  ];

  return (
    <LeafletMap
      markers={markers}
      center={LOBOS}
      zoom={8}
      height={height}
      onSelectMarker={(marker) => {
        const institucion = instituciones.find((i) => i.id === marker.id);
        if (institucion) onSelect?.(institucion);
      }}
      ariaLabel="Mapa de instituciones educativas cercanas a Lobos"
    />
  );
}

function MapaPage() {
  const { data } = useQuery(institucionesQuery);
  const [seleccionada, setSeleccionada] = useState<Institucion | null>(null);
  const instituciones = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Mapa"
        title="Qué tan lejos queda cada institución"
        description="Tomando como punto de partida la escuela en Lobos, mirá la ubicación de cada universidad, instituto o centro de formación."
      />
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <MapaInstituciones instituciones={instituciones} onSelect={setSeleccionada} height={560} />
        <div className="grid gap-3">
          {seleccionada && (
            <div className="rounded-xl border border-primary/40 bg-accent/40 p-5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                Seleccionada
              </p>
              <h2 className="mt-1 font-display text-base font-semibold">{seleccionada.nombre}</h2>
              <p className="text-sm text-muted-foreground">
                {seleccionada.ciudad} · {formatDistancia(seleccionada.distancia_km)}
              </p>
              <Link
                to="/tu-futuro/instituciones/$id"
                params={{ id: seleccionada.id }}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Ver ficha completa
              </Link>
            </div>
          )}
          <div className="max-h-[560px] overflow-y-auto rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {instituciones.map((institucion) => (
                <li key={institucion.id}>
                  <Link
                    to="/tu-futuro/instituciones/$id"
                    params={{ id: institucion.id }}
                    className="block px-5 py-4 transition-colors hover:bg-muted"
                  >
                    <p className="text-sm font-semibold">{institucion.nombre}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {labelTipoInstitucion(institucion.tipo)} · {institucion.ciudad} ·{" "}
                      {formatDistancia(institucion.distancia_km)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de instituciones | Orientación EES N.º 6" },
      {
        name: "description",
        content:
          "Mapa interactivo con universidades e institutos cercanos a Lobos: distancias, ubicación y acceso rápido a cada ficha.",
      },
      { property: "og:title", content: "Mapa de instituciones | EES N.º 6" },
      {
        property: "og:description",
        content: "Visualizá dónde queda cada universidad e instituto respecto de Lobos.",
      },
    ],
  }),
  component: MapaPage,
});
