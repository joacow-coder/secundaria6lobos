import {
  school as schoolDefaults,
  history as historyDefaults,
  anniversary as anniversaryDefaults,
  gallery as galleryDefaults,
  news as newsDefaults,
  events as eventsDefaults,
  videos as videosDefaults,
} from "@/data/school";

export type Hidden = { hidden?: boolean };

export type SchoolContent = typeof schoolDefaults;
export type HistoryContent = typeof historyDefaults;
export type AnniversaryContent = typeof anniversaryDefaults;

export type HeroContent = {
  badgeYear: number;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
};

export type GalleryItem = Hidden & {
  id: string;
  url: string;
  category: string;
  title: string;
  description: string;
};
export type NewsItem = Hidden & {
  id: string;
  image: string;
  date: string;
  title: string;
  excerpt: string;
};
export type EventItem = Hidden & {
  id: string;
  date: string;
  title: string;
  type: string;
};
export type VideoItem = Hidden & { id: string; url: string; title: string };
export type ComingSoonItem = Hidden & {
  id: string;
  icon: string;
  title: string;
  desc: string;
};

export type SectionKey =
  | "inicio"
  | "tufuturo"
  | "escuela"
  | "galeria"
  | "aniversario"
  | "noticias"
  | "eventos"
  | "redes"
  | "multimedia"
  | "proximamente"
  | "contacto";

export type SectionMeta = { key: SectionKey; label: string; hidden?: boolean };

export type SiteContent = {
  school: SchoolContent;
  hero: HeroContent;
  history: HistoryContent;
  anniversary: AnniversaryContent;
  gallery: { items: GalleryItem[] };
  news: { items: NewsItem[] };
  events: { items: EventItem[] };
  videos: { items: VideoItem[] };
  comingSoon: { intro: string; items: ComingSoonItem[] };
  sections: { order: SectionMeta[] };
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  inicio: "Inicio",
  tufuturo: "Tu Futuro",
  escuela: "Nuestra Escuela",
  galeria: "Galería",
  aniversario: "Aniversario",
  noticias: "Noticias",
  eventos: "Eventos",
  redes: "Redes",
  multimedia: "Multimedia",
  proximamente: "Próximamente",
  contacto: "Contacto",
};

const slug = (s: string, i: number) =>
  `${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${i}`;

export const defaultContent: SiteContent = {
  school: schoolDefaults,
  hero: {
    badgeYear: 2015,
    title: schoolDefaults.name,
    subtitle:
      "Una comunidad educativa que forma, acompaña e inspira. Bienvenidos a la casa de todos y todas.",
    primaryCta: "Conocer la escuela",
    secondaryCta: "Consultar información",
  },
  history: historyDefaults,
  anniversary: anniversaryDefaults,
  gallery: {
    items: galleryDefaults.map((g, i) => ({ id: slug(g.title, i), ...g })),
  },
  news: { items: newsDefaults.map((n, i) => ({ id: slug(n.title, i), ...n })) },
  events: { items: eventsDefaults.map((e, i) => ({ id: slug(e.title, i), ...e })) },
  videos: { items: videosDefaults.map((v, i) => ({ id: slug(v.title, i), ...v })) },
  comingSoon: {
    intro:
      "Estamos trabajando en nuevas secciones que estarán disponibles en próximas actualizaciones de nuestro sitio.",
    items: [
      { id: "cs-1", icon: "🎓", title: "Centro de Estudiantes", desc: "Espacio de representación y participación estudiantil." },
      { id: "cs-2", icon: "📚", title: "Proyectos Escolares", desc: "Iniciativas pedagógicas e interdisciplinarias en marcha." },
      { id: "cs-3", icon: "🖼️", title: "Galería histórica de promociones", desc: "Recorrido visual por las promociones a lo largo de los años." },
      { id: "cs-4", icon: "📰", title: "Noticias y novedades institucionales", desc: "Comunicados y novedades de la comunidad educativa." },
      { id: "cs-5", icon: "📅", title: "Calendario de eventos escolares", desc: "Agenda completa de actividades y fechas destacadas." },
    ],
  },
  sections: {
    order: (
      [
        "inicio",
        "tufuturo",
        "escuela",
        "galeria",
        "aniversario",
        "noticias",
        "eventos",
        "redes",
        "multimedia",
        "proximamente",
        "contacto",
      ] as SectionKey[]
    ).map((key) => ({ key, label: SECTION_LABELS[key] })),
  },
};

export type SectionName = keyof SiteContent;

export const SECTION_NAMES: SectionName[] = [
  "school",
  "hero",
  "history",
  "anniversary",
  "gallery",
  "news",
  "events",
  "videos",
  "comingSoon",
  "sections",
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Shallow-deep merge of stored data over defaults (arrays are replaced). */
export function mergeSection<K extends SectionName>(
  name: K,
  stored: unknown,
): SiteContent[K] {
  const base = defaultContent[name];
  if (!isPlainObject(stored)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(stored)) {
    const cur = out[k];
    out[k] = isPlainObject(v) && isPlainObject(cur) ? { ...cur, ...v } : v;
  }
  return out as SiteContent[K];
}

export function buildContent(rows: { section: string; data: unknown }[]): SiteContent {
  const map = new Map(rows.map((r) => [r.section, r.data]));
  const out = {} as SiteContent;
  for (const name of SECTION_NAMES) {
    // @ts-expect-error keyed assignment
    out[name] = mergeSection(name, map.get(name));
  }
  return out;
}

export const visible = <T extends Hidden>(items: T[] | undefined): T[] =>
  (items ?? []).filter((i) => !i.hidden);
