import { queryOptions } from "@tanstack/react-query";
import { futuro } from "./client";

export type Institucion = {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  historia: string | null;
  ciudad: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  distancia_km: number | null;
  como_llegar: string | null;
  modalidad: string | null;
  sitio_oficial: string | null;
  info_inscripcion: string | null;
  contacto: string | null;
  logo_url: string | null;
  imagen_url: string | null;
  anio_actualizacion?: number | null;
  archivado?: boolean;
};

export type Carrera = {
  id: string;
  nombre: string;
  area: string | null;
  descripcion: string | null;
  duracion: string | null;
  duracion_anios: number | null;
  modalidad: string | null;
  requisitos: string | null;
  materias: string[] | null;
  perfil: string | null;
  salidas_laborales: string | null;
  enlace_oficial: string | null;
  institucion_id: string | null;
  anio_actualizacion?: number | null;
  archivado?: boolean;
  instituciones?: Pick<Institucion, "id" | "nombre" | "ciudad" | "distancia_km" | "tipo"> | null;
};

export type Beca = {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  requisitos: string | null;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  enlace_oficial: string | null;
  anio_actualizacion?: number | null;
};

export type Noticia = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido: string | null;
  imagen_url: string | null;
  enlace: string | null;
  fecha_publicacion: string | null;
};

export type Evento = {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  enlace: string | null;
};

export type Recurso = {
  id: string;
  titulo: string;
  categoria: string;
  resumen: string | null;
  contenido: string | null;
  enlace?: string | null;
  orden?: number | null;
};

function unwrap<T>(res: { data: T[] | null; error: { message: string } | null }): T[] {
  if (res.error) throw new Error(res.error.message);
  return res.data ?? [];
}

export const institucionesQuery = queryOptions({
  queryKey: ["futuro", "instituciones"],
  queryFn: async () =>
    unwrap<Institucion>(
      (await futuro
        .from("instituciones")
        .select("*")
        .eq("archivado", false)
        .order("distancia_km", { ascending: true })) as never,
    ),
});

export const carrerasQuery = queryOptions({
  queryKey: ["futuro", "carreras"],
  queryFn: async () =>
    unwrap<Carrera>(
      (await futuro
        .from("carreras")
        .select("*, instituciones(id, nombre, ciudad, distancia_km, tipo)")
        .eq("archivado", false)
        .order("nombre")) as never,
    ),
});

export const becasQuery = queryOptions({
  queryKey: ["futuro", "becas"],
  queryFn: async () =>
    unwrap<Beca>(
      (await futuro.from("becas").select("*").eq("archivado", false).order("nombre")) as never,
    ),
});

export const noticiasQuery = queryOptions({
  queryKey: ["futuro", "noticias"],
  queryFn: async () =>
    unwrap<Noticia>(
      (await futuro
        .from("noticias")
        .select("*")
        .eq("archivado", false)
        .order("fecha_publicacion", { ascending: false })) as never,
    ),
});

export const eventosQuery = queryOptions({
  queryKey: ["futuro", "eventos"],
  queryFn: async () =>
    unwrap<Evento>(
      (await futuro
        .from("eventos")
        .select("*")
        .eq("archivado", false)
        .order("fecha_inicio")) as never,
    ),
});

export const recursosQuery = queryOptions({
  queryKey: ["futuro", "recursos"],
  queryFn: async () =>
    unwrap<Recurso>(
      (await futuro.from("recursos").select("*").eq("archivado", false).order("orden")) as never,
    ),
});

export function formatFecha(value?: string | null): string {
  if (!value) return "A confirmar";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDistancia(value?: number | null): string {
  if (value == null) return "Distancia a confirmar";
  if (Number(value) === 0) return "En Lobos";
  return `${Math.round(Number(value))} km desde Lobos`;
}
