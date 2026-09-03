// Utilidades de la Biblioteca Digital (validación de nombres, tipos de recurso,
// proveedores de enlaces, formato de tamaños y búsqueda difusa).

const BASE_BLOCKED = [
  "batman",
  "superman",
  "spiderman",
  "goku",
  "messi",
  "maradona",
  "ronaldo",
  "admin",
  "administrador",
  "anonimo",
  "anonima",
  "usuario",
  "invitado",
  "profesor",
  "alumno",
  "test",
  "prueba",
  "asdf",
  "qwerty",
  "xdxd",
  "jaja",
  "lorem ipsum",
  "john doe",
];

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function toTitleCase(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trimStart()
    .split(" ")
    .map((word) =>
      word.length === 0
        ? word
        : word
            .split("-")
            .map((part) =>
              part.length === 0
                ? part
                : part.charAt(0).toLocaleUpperCase("es-AR") +
                  part.slice(1).toLocaleLowerCase("es-AR"),
            )
            .join("-"),
    )
    .join(" ");
}

const NAME_ERROR =
  "Por favor, ingresá tu nombre y apellido reales para acceder a la Biblioteca Digital.";

export function validateStudentName(
  raw: string,
  extraBlocked: string[] = [],
): { ok: boolean; message?: string } {
  const pretty = toTitleCase(raw).trim();
  const flat = normalize(pretty);

  if (
    pretty.length < 6 ||
    pretty.length > 60 ||
    !/^[a-záéíóúüñ' -]+$/i.test(flat) ||
    /[0-9]/.test(pretty) ||
    /[^\p{L}\s'-]/u.test(pretty)
  ) {
    return { ok: false, message: NAME_ERROR };
  }

  const words = pretty.split(" ").filter(Boolean);
  const invalid =
    words.length < 2 ||
    words.length > 5 ||
    words.some((w) => w.replace(/[-']/g, "").length < 2) ||
    /(.)\1{2,}/i.test(flat.replace(/\s/g, "")) ||
    new Set(words.map((w) => normalize(w))).size < words.length ||
    [...BASE_BLOCKED, ...extraBlocked.map(normalize)].some(
      (w) => w.length > 2 && flat.includes(w),
    );

  return invalid ? { ok: false, message: NAME_ERROR } : { ok: true };
}

export function suggestName(raw: string): string | null {
  const pretty = toTitleCase(raw);
  return pretty !== raw.trim() && pretty.length > 0 ? pretty : null;
}

export const KIND_LABELS: Record<string, string> = {
  libro: "📚 Libro",
  pdf: "📄 PDF",
  documento: "📝 Documento",
  planilla: "📊 Planilla",
  presentacion: "📑 Presentación",
  imagen: "🖼 Imagen",
  video: "🎥 Video",
  audio: "🎧 Audio",
  comprimido: "📦 Comprimido",
  enlace: "🔗 Enlace",
  actividad: "✍️ Actividad",
  otro: "📁 Archivo",
};

export const KIND_FILTERS = [
  "libro",
  "pdf",
  "video",
  "imagen",
  "audio",
  "presentacion",
  "actividad",
  "enlace",
  "comprimido",
] as const;

const EXTENSION_KIND: Record<string, string> = {
  pdf: "pdf",
  doc: "documento",
  docx: "documento",
  txt: "documento",
  rtf: "documento",
  odt: "documento",
  xls: "planilla",
  xlsx: "planilla",
  csv: "planilla",
  ppt: "presentacion",
  pptx: "presentacion",
  odp: "presentacion",
  png: "imagen",
  jpg: "imagen",
  jpeg: "imagen",
  webp: "imagen",
  gif: "imagen",
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
  zip: "comprimido",
  rar: "comprimido",
  "7z": "comprimido",
};

export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSION_KIND)
  .map((ext) => `.${ext}`)
  .join(",");

export function kindFromFilename(filename: string): string {
  return EXTENSION_KIND[filename.split(".").pop()?.toLowerCase() ?? ""] ?? "otro";
}

export type Provider = { id: string; label: string; icon: string; hosts: string[] };

export const PROVIDERS: Provider[] = [
  { id: "youtube", label: "YouTube", icon: "🎬", hosts: ["youtube.com", "youtu.be"] },
  {
    id: "drive",
    label: "Google Drive",
    icon: "🗂",
    hosts: ["drive.google.com", "docs.google.com"],
  },
  { id: "slides", label: "Google Slides", icon: "📑", hosts: ["slides.google.com"] },
  { id: "canva", label: "Canva", icon: "🎨", hosts: ["canva.com"] },
  {
    id: "genially",
    label: "Genially",
    icon: "✨",
    hosts: ["genial.ly", "view.genial.ly", "genially.com"],
  },
  {
    id: "onedrive",
    label: "OneDrive",
    icon: "☁️",
    hosts: ["onedrive.live.com", "1drv.ms", "sharepoint.com"],
  },
  { id: "dropbox", label: "Dropbox", icon: "📦", hosts: ["dropbox.com"] },
  { id: "wikipedia", label: "Wikipedia", icon: "🌐", hosts: ["wikipedia.org"] },
  { id: "geogebra", label: "GeoGebra", icon: "📐", hosts: ["geogebra.org"] },
];

export function detectProvider(url: string): Provider | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return (
      PROVIDERS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null
    );
  } catch {
    return null;
  }
}

export function validateUrl(
  raw: string,
): { ok: boolean; warning?: string; provider?: string | undefined } {
  const value = raw.trim();
  if (!value) return { ok: false, warning: "Ingresá un enlace." };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return {
      ok: false,
      warning: "El enlace no tiene un formato válido (debe empezar con https://).",
    };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, warning: "Por seguridad, el enlace debe usar HTTPS." };
  }
  if (/[\s<>"]/.test(value)) {
    return { ok: false, warning: "El enlace contiene caracteres inválidos." };
  }
  return { ok: true, provider: detectProvider(value)?.id };
}

export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed${parsed.pathname}`;
    if (host.endsWith("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    if (host === "drive.google.com") {
      const match = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    if (host === "docs.google.com") return url.replace(/\/edit.*$/, "/preview");
    if (host.endsWith("canva.com")) return url.replace(/\/(edit|view).*$/, "/view?embed");
    if (
      host.endsWith("genial.ly") ||
      host.endsWith("genially.com") ||
      host.endsWith("geogebra.org") ||
      host.endsWith("wikipedia.org")
    ) {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

export const YEARS = [1, 2, 3, 4, 5, 6];
export const yearLabel = (year: number) => `${year}° Año`;

export const SHIFTS = ["manana", "tarde", "vespertino"] as const;
export const SHIFT_LABELS: Record<string, string> = {
  manana: "Turno Mañana",
  tarde: "Turno Tarde",
  vespertino: "Turno Vespertino",
};

export function courseLabel(course: { year: number; shift: string }): string {
  return `${yearLabel(course.year)} · ${SHIFT_LABELS[course.shift] ?? course.shift}`;
}

/** El "año lectivo" de un recurso/comunicado es el año calendario en que se creó. */
export function isCurrentSchoolYear(createdAt: string): boolean {
  return new Date(createdAt).getFullYear() === new Date().getFullYear();
}

export const IMPORTANCE: Record<string, { label: string; className: string }> = {
  normal: { label: "Normal", className: "bg-secondary text-secondary-foreground" },
  importante: { label: "Importante", className: "bg-warning/20 text-warning-foreground" },
  urgente: { label: "Urgente", className: "bg-destructive/15 text-destructive" },
};

export const EVENT_TYPES: Record<string, string> = {
  evaluacion: "📖 Evaluación",
  fecha: "📝 Fecha importante",
  acto: "🏫 Acto escolar",
  institucional: "🎉 Evento institucional",
  reunion: "📅 Reunión",
  salida: "🚍 Salida educativa",
  unidad: "📚 Inicio / fin de unidad",
};

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit] ?? "B"}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j] ?? 0;
      row[j] = Math.min(
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = current;
    }
  }
  return row[b.length] ?? 99;
}

type Searchable = {
  title: string;
  topic: string | null;
  tags: string[];
  subject_code: string;
  teacher_name: string;
  unit: string | null;
  description: string;
  kind: string;
  year: number;
};

/** Puntaje de relevancia (0 = no coincide). Tolera errores de tipeo. */
export function scoreResource(
  resource: Searchable,
  query: string,
  subjectName?: string,
): number {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;

  const fields: [string, number][] = [
    [resource.title, 6],
    [resource.topic ?? "", 4],
    [resource.tags.join(" "), 3.5],
    [subjectName ?? "", 3],
    [resource.subject_code, 3],
    [resource.teacher_name, 3],
    [resource.unit ?? "", 2],
    [resource.description, 2],
    [resource.kind, 1.5],
    [`${resource.year} año`, 1.5],
  ];

  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [raw, weight] of fields) {
      const value = normalize(raw);
      if (!value) continue;
      if (value.includes(term)) {
        best = Math.max(best, weight);
        continue;
      }
      if (value.split(/\s+/).some((w) => w.length > 3 && editDistance(w, term) <= 1)) {
        best = Math.max(best, weight * 0.6);
      }
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}