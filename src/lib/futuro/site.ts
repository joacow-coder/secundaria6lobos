import logoAsset from "@/assets/logo.png";

export const futuroSite = {
  nombre: "Orientación Estudiantil y Futuro",
  escuela: "Escuela de Educación Secundaria N.º 6",
  ciudad: "Lobos, Buenos Aires",
  sitioEscuela: "/",
  logo: logoAsset,
  contacto: "secundaria6lobos@abc.gob.ar",
  direccion: "San Martín N.º 57, Lobos, Buenos Aires",
};

export const LOBOS = { lat: -35.1856, lng: -59.0956 };

export const TIPOS_INSTITUCION = [
  { value: "universidad", label: "Universidad" },
  { value: "terciario", label: "Instituto terciario" },
  { value: "formacion_profesional", label: "Formación profesional" },
  { value: "curso", label: "Cursos y capacitaciones" },
];

export const TIPOS_BECA = [
  { value: "nacional", label: "Nacional" },
  { value: "provincial", label: "Provincial" },
  { value: "universitaria", label: "Universitaria" },
  { value: "ayuda", label: "Ayuda económica" },
  { value: "transporte", label: "Transporte" },
  { value: "residencia", label: "Residencia" },
];

export const CATEGORIAS_EVENTO = [
  { value: "inscripcion", label: "Inscripción" },
  { value: "examen", label: "Examen de ingreso" },
  { value: "charla", label: "Charla" },
  { value: "beca", label: "Beca" },
  { value: "evento", label: "Evento universitario" },
];

export const labelTipoInstitucion = (v: string) =>
  TIPOS_INSTITUCION.find((t) => t.value === v)?.label ?? "Institución";
export const labelTipoBeca = (v: string) =>
  TIPOS_BECA.find((t) => t.value === v)?.label ?? "Beca";
export const labelCategoriaEvento = (v: string) =>
  CATEGORIAS_EVENTO.find((t) => t.value === v)?.label ?? "Fecha";

export const BASE = "/tu-futuro" as const;

export const futuroNav = [
  { to: "/tu-futuro/carreras", label: "Carreras" },
  { to: "/tu-futuro/instituciones", label: "Instituciones" },
  { to: "/tu-futuro/mapa", label: "Mapa" },
  { to: "/tu-futuro/caminos", label: "Después de la secundaria" },
  { to: "/tu-futuro/becas", label: "Becas" },
  { to: "/tu-futuro/test", label: "No sé qué estudiar" },
  { to: "/tu-futuro/calendario", label: "Calendario" },
  { to: "/tu-futuro/noticias", label: "Noticias" },
  { to: "/tu-futuro/recursos", label: "Recursos" },
] as const;
