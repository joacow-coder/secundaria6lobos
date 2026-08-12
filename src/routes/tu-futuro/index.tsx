import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  GraduationCap,
  Heart,
  MapPin,
  Newspaper,
  Search,
  Settings2,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import {
  carrerasQuery,
  institucionesQuery,
  becasQuery,
  noticiasQuery,
  eventosQuery,
  formatFecha,
} from "@/lib/futuro/data";
import { futuroSite, labelCategoriaEvento } from "@/lib/futuro/site";
import { useMemoria, guardarPreferencias } from "@/lib/futuro/store";

function Section({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={["mx-auto max-w-6xl px-4 py-14 sm:px-6", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}

function ContinuarExplorando() {
  const memoria = useMemoria();
  const carreras = [...memoria.favoritosCarreras, ...memoria.visitasCarreras]
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .slice(0, 4);
  const instituciones = [...memoria.favoritosInstituciones, ...memoria.visitasInstituciones]
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .slice(0, 4);

  if (
    carreras.length === 0 &&
    instituciones.length === 0 &&
    memoria.busquedas.length === 0 &&
    !memoria.resultadoTest &&
    !memoria.ultimaSeccion
  )
    return null;

  return (
    <Section className="pt-0">
      <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Tu recorrido en este dispositivo</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Continuar explorando</h2>
          </div>
          {memoria.ultimaSeccion && (
            <Link
              to={memoria.ultimaSeccion.path}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <GraduationCap className="h-4 w-4 text-primary" />
              Volver a {memoria.ultimaSeccion.label}
            </Link>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {instituciones.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Instituciones que consultaste</p>
              <ul className="mt-3 grid gap-2">
                {instituciones.map((inst) => (
                  <li key={inst.id}>
                    <Link
                      to="/tu-futuro/instituciones/$id"
                      params={{ id: inst.id }}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm hover:border-primary/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{inst.nombre}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {carreras.length > 0 && (
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Heart className="h-4 w-4 text-primary" /> Carreras guardadas o vistas
              </p>
              <ul className="mt-3 grid gap-2">
                {carreras.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                    <span className="block font-medium">{c.nombre}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/tu-futuro/carreras" search={{ q: undefined }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Ver el buscador de carreras <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {(memoria.busquedas.length > 0 || memoria.resultadoTest) && (
          <div className="mt-8 grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
            {memoria.busquedas.length > 0 && (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Search className="h-4 w-4 text-primary" /> Últimas búsquedas
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {memoria.busquedas.slice(0, 6).map((q) => (
                    <Link
                      key={q}
                      to="/tu-futuro/carreras"
                      search={{ q }}
                      className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    >
                      {q}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {memoria.resultadoTest && (
              <div>
                <p className="text-sm font-semibold">Tu resultado de “No sé qué estudiar”</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Áreas más afines: {memoria.resultadoTest.areas.join(", ")}.
                </p>
                <Link
                  to="/tu-futuro/test"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Ver o rehacer el test <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

type PreguntaCampo = "interes" | "anio" | "estado";
type Preferencias = { interes?: string; anio?: string; estado?: string };

const PREGUNTAS: { campo: PreguntaCampo; titulo: string; opciones: string[] }[] = [
  {
    campo: "interes",
    titulo: "¿Qué te interesa más en este momento?",
    opciones: ["Carreras", "Universidades e institutos", "Becas", "Todas las opciones"],
  },
  {
    campo: "anio",
    titulo: "¿En qué año escolar estás?",
    opciones: ["4.º año", "5.º año", "6.º año", "Ya egresé"],
  },
  {
    campo: "estado",
    titulo: "¿Cómo va tu búsqueda?",
    opciones: [
      "Recién empiezo",
      "Estoy comparando opciones",
      "Ya casi decidí",
      "Ya elegí y busco cómo inscribirme",
    ],
  },
];

function ModalPreferencias({
  abierto,
  onCerrar,
  inicial,
}: {
  abierto: boolean;
  onCerrar: () => void;
  inicial: { interes: string; anio: string; estado: string } | null;
}) {
  const [respuestas, setRespuestas] = useState<Preferencias>({});

  useEffect(() => {
    if (abierto) {
      setRespuestas(inicial ? { interes: inicial.interes, anio: inicial.anio, estado: inicial.estado } : {});
    }
  }, [abierto, inicial]);

  if (!abierto) return null;

  const completo = PREGUNTAS.every((p) => respuestas[p.campo]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-background p-6 sm:rounded-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Personalizá tu experiencia</p>
            <h2 className="mt-2 font-display text-xl font-bold leading-snug">Tres preguntas rápidas</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Solo sirven para ordenar la página de inicio con lo más útil para vos. Se guardan en este
              dispositivo y no se comparten con nadie.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          {PREGUNTAS.map((p) => (
            <div key={p.campo}>
              <p className="text-sm font-semibold">{p.titulo}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {p.opciones.map((opcion) => (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => setRespuestas((r) => ({ ...r, [p.campo]: opcion }))}
                    className={
                      respuestas[p.campo] === opcion
                        ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                        : "rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    }
                  >
                    {opcion}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!completo}
            onClick={() => {
              guardarPreferencias({
                interes: respuestas.interes ?? "",
                anio: respuestas.anio ?? "",
                estado: respuestas.estado ?? "",
              });
              onCerrar();
            }}
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Guardar y personalizar
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
          >
            Ahora no
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Esto no reemplaza al test “No sé qué estudiar”: es solo para destacar contenido.
        </p>
      </div>
    </div>
  );
}

function usePreferenciasModal() {
  const memoria = useMemoria();
  const [abierto, setAbierto] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (listo) return;
    const t = setTimeout(() => {
      setListo(true);
      if (!memoria.preferencias) setAbierto(true);
    }, 600);
    return () => clearTimeout(t);
  }, [memoria.preferencias, listo]);

  return {
    abierto,
    abrir: () => setAbierto(true),
    cerrar: () => setAbierto(false),
    preferencias: memoria.preferencias,
  };
}

const CAMINOS = [
  {
    to: "/tu-futuro/carreras" as const,
    icon: GraduationCap,
    titulo: "Buscador de carreras",
    texto: "Filtrá por área, duración, modalidad y distancia desde Lobos.",
  },
  {
    to: "/tu-futuro/instituciones" as const,
    icon: MapPin,
    titulo: "Universidades e institutos",
    texto: "Fichas completas con ubicación, contacto y oferta académica.",
  },
  {
    to: "/tu-futuro/becas" as const,
    icon: Wallet,
    titulo: "Becas y ayudas",
    texto: "Programas nacionales, provinciales y universitarios vigentes.",
  },
  {
    to: "/tu-futuro/test" as const,
    icon: Compass,
    titulo: "No sé qué estudiar",
    texto: "Un test breve que sugiere áreas y carreras según tus intereses.",
  },
];

const ORDEN_POR_INTERES: Record<string, string[]> = {
  Carreras: ["/tu-futuro/carreras", "/tu-futuro/test", "/tu-futuro/instituciones", "/tu-futuro/becas"],
  "Universidades e institutos": [
    "/tu-futuro/instituciones",
    "/tu-futuro/carreras",
    "/tu-futuro/becas",
    "/tu-futuro/test",
  ],
  Becas: ["/tu-futuro/becas", "/tu-futuro/carreras", "/tu-futuro/instituciones", "/tu-futuro/test"],
  "Todavía no sé qué estudiar": [
    "/tu-futuro/test",
    "/tu-futuro/carreras",
    "/tu-futuro/instituciones",
    "/tu-futuro/becas",
  ],
  "Busco cómo pagar mis estudios": [
    "/tu-futuro/becas",
    "/tu-futuro/carreras",
    "/tu-futuro/instituciones",
    "/tu-futuro/test",
  ],
};

function HomePage() {
  const carreras = useQuery(carrerasQuery);
  const instituciones = useQuery(institucionesQuery);
  const becas = useQuery(becasQuery);
  const eventos = useQuery(eventosQuery);
  const noticias = useQuery(noticiasQuery);
  const memoria = useMemoria();
  const modal = usePreferenciasModal();
  const preferenciasTipadas = modal.preferencias as
    | { interes: string; anio: string; estado: string }
    | null;
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  const mostrarBienvenida = montado && memoria.visitas > 1;

  const caminos = (() => {
    const interesPref = (memoria.preferencias?.interes as string | undefined) ?? "";
  const orden = ORDEN_POR_INTERES[interesPref];
    if (!montado || !orden) return CAMINOS;
    return [...CAMINOS].sort((a, b) => orden.indexOf(a.to) - orden.indexOf(b.to));
  })();

  const hoy = new Date().toISOString().slice(0, 10);
  const proximasFechas = (eventos.data ?? [])
    .filter((e) => (e.fecha_fin ?? e.fecha_inicio ?? "") >= hoy)
    .slice(0, 4);
  const ultimasNoticias = (noticias.data ?? []).slice(0, 3);

  const stats = [
    { valor: carreras.data?.length ?? 0, label: "carreras relevadas" },
    { valor: instituciones.data?.length ?? 0, label: "instituciones" },
    { valor: becas.data?.length ?? 0, label: "becas y ayudas" },
  ];

  return (
    <>
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              {futuroSite.escuela} · {futuroSite.ciudad}
            </div>
            <h1 className="mt-6 font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-shine">Tu futuro</span>
            </h1>
            <p className="mt-3 text-lg font-semibold text-white sm:text-xl">Orientación Académica</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Información verificada y actualizada sobre universidades, institutos, carreras, becas y
              fechas de inscripción para las y los estudiantes de la EES N.º 6.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tu-futuro/carreras" search={{ q: undefined }}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-brand-navy transition-transform hover:-translate-y-0.5"
              >
                Explorar carreras
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tu-futuro/test"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                No sé qué estudiar
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl font-bold text-white">{s.valor}</dt>
                  <dd className="mt-1 text-xs leading-snug text-white/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Próximas fechas clave
            </p>
            <ul className="mt-5 grid gap-4">
              {proximasFechas.length === 0 && (
                <li className="text-sm text-white/70">Cargando el calendario del ciclo lectivo…</li>
              )}
              {proximasFechas.map((e) => (
                <li key={e.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <p className="text-xs text-white/60">
                    {labelCategoriaEvento(e.categoria)} · {formatFecha(e.fecha_inicio)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{e.titulo}</p>
                </li>
              ))}
            </ul>
            <Link
              to="/tu-futuro/calendario"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
            >
              Ver calendario completo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {mostrarBienvenida && (
        <div className="border-b border-border bg-accent/40">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-accent-foreground">
              ¡Bienvenido nuevamente! Continuá explorando donde lo dejaste.
            </p>
            <button
              type="button"
              onClick={modal.abrir}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Settings2 className="h-3.5 w-3.5" /> Modificar mis preferencias
            </button>
          </div>
        </div>
      )}

      {montado && <ContinuarExplorando />}

      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Por dónde empezar</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Cuatro caminos para orientarte</h2>
            {montado && preferenciasTipadas && (
              <p className="mt-2 text-sm text-muted-foreground">
                Ordenado según tus respuestas: {preferenciasTipadas.interes.toLowerCase()} ·{" "}
                {preferenciasTipadas.estado.toLowerCase()}.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={modal.abrir}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Settings2 className="h-4 w-4 text-primary" /> Modificar mis preferencias
          </button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {caminos.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-base font-semibold">{c.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.texto}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Entrar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <ModalPreferencias abierto={modal.abierto} onCerrar={modal.cerrar} inicial={preferenciasTipadas} />

      <Section className="pt-0">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Después de la secundaria</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">No todos los caminos son la universidad</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Terciarios, formación profesional, oficios, cursos cortos, trabajo y estudio, servicio
                militar voluntario o tomarte un año para decidir. Conocé cada opción con sus ventajas,
                requisitos y cómo se accede.
              </p>
              <Link
                to="/tu-futuro/caminos"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Ver todas las opciones <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { i: MapPin, t: "Mapa interactivo", d: "Instituciones cercanas a Lobos" },
                { i: Wallet, t: "Becas", d: "Progresar, Manuel Belgrano y más" },
                { i: CalendarDays, t: "Calendario", d: "Inscripciones y exámenes" },
                { i: Newspaper, t: "Novedades", d: "Actualizado por la escuela" },
              ].map((item) => (
                <div key={item.t} className="rounded-xl border border-border bg-background p-5">
                  <item.i className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{item.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {ultimasNoticias.length > 0 && (
        <Section className="pt-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Novedades</p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Últimas noticias</h2>
            </div>
            <Link to="/tu-futuro/noticias" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {ultimasNoticias.map((n) => (
              <article key={n.id} className="rounded-xl border border-border bg-card p-6">
                <p className="text-xs text-muted-foreground">{formatFecha(n.fecha_publicacion)}</p>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug">{n.titulo}</h3>
                {n.resumen && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{n.resumen}</p>
                )}
              </article>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/")({
  head: () => ({
    meta: [
      { title: "Orientación Estudiantil EES N.º 6 | Carreras, becas y universidades" },
      {
        name: "description",
        content:
          "Plataforma de orientación de la Escuela de Educación Secundaria N.º 6 de Lobos: buscador de carreras, universidades cercanas, becas, calendario de inscripciones y test vocacional.",
      },
      {
        property: "og:title",
        content: "Orientación Estudiantil EES N.º 6 | Carreras, becas y universidades",
      },
      {
        property: "og:description",
        content:
          "Plataforma de orientación de la Escuela de Educación Secundaria N.º 6 de Lobos: buscador de carreras, universidades cercanas, becas, calendario de inscripciones y test vocacional.",
      },
    ],
  }),
  component: HomePage,
});
