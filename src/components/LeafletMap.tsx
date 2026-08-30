import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMapInstance, Marker as LeafletMarkerInstance } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  /** "primary" resalta el marcador (por ejemplo, la propia escuela). */
  variant?: "primary" | "default";
};

function popupHtml(marker: MapMarker): string {
  return `<div style="font-family:Inter,sans-serif;max-width:220px">
    <strong style="display:block;font-size:13px;color:#182548">${marker.label}</strong>
    ${marker.sublabel ? `<span style="font-size:12px;color:#5b6478">${marker.sublabel}</span>` : ""}
  </div>`;
}

/** Mapa interactivo con Leaflet.js + tiles de OpenStreetMap (sin claves ni facturación). */
export function LeafletMap({
  markers,
  center,
  height = 420,
  zoom = 14,
  onSelectMarker,
  className = "",
  ariaLabel = "Mapa interactivo",
  bordered = true,
}: {
  markers: MapMarker[];
  /** Centro inicial antes de ubicar los marcadores. Por defecto, el primer marcador (si hay). */
  center?: { lat: number; lng: number };
  height?: number;
  zoom?: number;
  onSelectMarker?: (marker: MapMarker) => void;
  className?: string;
  ariaLabel?: string;
  /** Desactivalo cuando el mapa ya va dentro de una tarjeta con su propio borde/esquinas. */
  bordered?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markersLayerRef = useRef<LeafletMarkerInstance[]>([]);
  const onSelectRef = useRef(onSelectMarker);
  onSelectRef.current = onSelectMarker;
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet")
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const initialCenter = center ?? markers[0] ?? { lat: 0, lng: 0 };
        const map = L.map(containerRef.current, {
          zoomControl: true,
        }).setView([initialCenter.lat, initialCenter.lng], zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }).addTo(map);
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el mapa.");
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      const map = mapRef.current;

      markersLayerRef.current.forEach((marker) => marker.remove());
      markersLayerRef.current = [];

      const points: [number, number][] = [];
      markers.forEach((marker) => {
        const isPrimary = marker.variant === "primary";
        const size = isPrimary ? 22 : 16;
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${
            isPrimary ? "#1b2a5e" : "#4b83c4"
          };border:${isPrimary ? 3 : 2}px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
        const leafletMarker = L.marker([marker.lat, marker.lng], { icon, title: marker.label }).addTo(map);
        leafletMarker.bindPopup(popupHtml(marker));
        leafletMarker.on("click", () => onSelectRef.current?.(marker));
        markersLayerRef.current.push(leafletMarker);
        points.push([marker.lat, marker.lng]);
      });

      if (points.length === 1) {
        map.setView(points[0], zoom);
      } else if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, markers, zoom]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center px-6 text-center text-sm text-muted-foreground ${
          bordered ? "rounded-xl border border-dashed border-border bg-muted/30" : ""
        } ${className}`}
        style={{ height }}
      >
        El mapa no está disponible en este momento.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={`w-full overflow-hidden bg-muted ${bordered ? "rounded-xl border border-border" : ""} ${className}`}
      aria-label={ariaLabel}
    />
  );
}
