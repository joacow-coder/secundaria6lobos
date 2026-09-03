/**
 * Genera rutas de Storage organizadas por año lectivo y categoría, en vez de
 * la ruta plana anterior (`${Date.now()}-${rand}-${filename}` sin carpetas).
 * Con los años, tener todo en una sola carpeta plana vuelve imposible
 * auditar o limpiar el bucket — esto separa cada subida en
 * `{categoria}/{añoLectivo}/{...segmentos}/{archivo}`.
 *
 * Los archivos ya subidos con el patrón viejo siguen funcionando: las rutas
 * de descarga usan el `file_path`/`attachment_path` guardado en la fila, no
 * lo reconstruyen por convención — esto solo aplica a partir de ahora.
 */
export type StorageCategory = "recursos" | "mensajes" | "sitio";

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "general";
}

export function buildStoragePath(
  category: StorageCategory,
  filename: string,
  opts?: { shift?: string | null; segments?: string[] },
): string {
  const schoolYear = new Date().getFullYear();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-70);
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const segments = [
    category,
    String(schoolYear),
    ...(opts?.shift ? [sanitizeSegment(opts.shift)] : []),
    ...(opts?.segments ?? []).filter(Boolean).map(sanitizeSegment),
    `${uniquePrefix}-${cleanFilename}`,
  ];
  return segments.join("/");
}
