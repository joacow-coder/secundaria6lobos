import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/futuro/Layout";
import { institucionesQuery, formatDistancia, type Institucion } from "@/lib/futuro/data";
import { labelTipoInstitucion, LOBOS } from "@/lib/futuro/site";

declare global {
  interface Window {
    google?: any;
    __initEes6Map?: () => void;
  }
}

let mapsPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("sin navegador"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined) ?? "";
  if (!key) return Promise.reject(new Error("Falta la clave de Google Maps"));
  mapsPromise = new Promise((resolve, reject) => {
    window.__initEes6Map = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initEes6Map&channel=${channel}`;
    script.async = true;
    script.onerror = () => reject(new Error("No se pudo cargar el mapa"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

const mapStyles = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe0f0" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f6f7f9" }] },
];

function MapaInstituciones({
  instituciones,
  onSelect,
  height = 460,
}: {
  instituciones: Institucion[];
  onSelect?: (institucion: Institucion) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = window.google;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: LOBOS.lat, lng: LOBOS.lng },
          zoom: 8,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setReady(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = window.google;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: LOBOS.lat, lng: LOBOS.lng });
    const escuelaMarker = new google.maps.Marker({
      position: { lat: LOBOS.lat, lng: LOBOS.lng },
      map: mapRef.current,
      title: "EES N.º 6 — Lobos",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#1b2a5e",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
    });
    markersRef.current.push(escuelaMarker);
    instituciones.forEach((institucion) => {
      if (institucion.lat === null || institucion.lng === null) return;
      const marker = new google.maps.Marker({
        position: { lat: Number(institucion.lat), lng: Number(institucion.lng) },
        map: mapRef.current,
        title: institucion.nombre,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#4b83c4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        infoWindowRef.current.setContent(
          `<div style="font-family:Inter,sans-serif;max-width:220px">
            <strong style="display:block;font-size:13px;color:#182548">${institucion.nombre}</strong>
            <span style="font-size:12px;color:#5b6478">${institucion.ciudad ?? ""}</span>
           </div>`,
        );
        infoWindowRef.current.open({ anchor: marker, map: mapRef.current });
        onSelect?.(institucion);
      });
      bounds.extend(marker.getPosition());
      markersRef.current.push(marker);
    });
    if (instituciones.length > 0) mapRef.current.fitBounds(bounds, 60);
  }, [ready, instituciones, onSelect]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground"
        style={{ height }}
      >
        El mapa no está disponible en este momento. Podés ver la dirección y la distancia de cada institución en su ficha.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full overflow-hidden rounded-xl border border-border bg-muted"
      aria-label="Mapa de instituciones educativas cercanas a Lobos"
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
