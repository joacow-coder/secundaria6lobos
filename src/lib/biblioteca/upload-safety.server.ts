/**
 * Valida el content-type declarado por el cliente al subir un archivo.
 *
 * Por qué existe: el content-type que llega en la subida es el que el
 * navegador (o quien sea) decide mandar — no hay forma de confiar en él.
 * Si se guarda tal cual y después se sirve con ese mismo header, un archivo
 * subido con content-type "text/html" (aunque tenga extensión .jpg) se
 * ejecutaría como HTML/JS real al abrirlo, en el mismo origen del sitio —
 * un XSS almacenado clásico vía upload. Achica el impacto: acá las
 * credenciales de personal (código maestro) viven en localStorage, así que
 * un XSS no es solo "robar una cookie", es robar el código completo.
 *
 * Se bloquean los tipos que un navegador puede llegar a ejecutar/interpretar
 * como documento activo (HTML, XHTML, SVG, XML, JS). Todo lo demás se deja
 * pasar: la lista de "qué se puede subir" (PDF, Office, imágenes, audio,
 * video, comprimidos) ya la define ACCEPTED_EXTENSIONS en utils.ts — acá
 * solo se veta explícitamente lo peligroso, en vez de mantener un allowlist
 * paralelo que se desincroniza.
 */
const DANGEROUS_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "text/xml",
  "application/xml",
  "application/javascript",
  "text/javascript",
  "application/ecmascript",
  "text/ecmascript",
];

export function assertSafeUploadContentType(contentType: string): void {
  const normalized = contentType.trim().toLowerCase().split(";")[0];
  if (DANGEROUS_CONTENT_TYPES.includes(normalized)) {
    throw new Error(
      "Ese tipo de archivo no se puede subir por seguridad (HTML/SVG/XML/JS). Si es una imagen, subila como JPG, PNG o WebP.",
    );
  }
}

/**
 * Defensa en profundidad para las rutas que sirven archivos: incluso si algo
 * pasó el check de subida (o es un archivo viejo, subido antes de este
 * fix), los tipos peligrosos nunca se renderizan inline — se fuerzan a
 * descargar como adjunto pase lo que pase. Todo lo demás (imágenes, PDF,
 * audio, video, documentos) se deja como estaba: el navegador decide si lo
 * puede mostrar o lo descarga, según corresponda a ese tipo.
 */
export function canRenderInline(contentType: string): boolean {
  const normalized = contentType.trim().toLowerCase().split(";")[0];
  return !DANGEROUS_CONTENT_TYPES.includes(normalized);
}

/**
 * El nombre de archivo que va en `Content-Disposition: attachment;
 * filename="..."` puede venir directo de lo que alguien tipeó como nombre
 * de archivo (attachment_name de un comunicado) — nunca pasó por el mismo
 * saneo que la ruta de Storage. Sin esto, un nombre con comillas o saltos
 * de línea puede romper el parseo del header en el navegador.
 */
export function sanitizeHeaderFilename(filename: string): string {
  return filename.replace(/[\r\n"]/g, "_").slice(0, 200) || "archivo";
}
