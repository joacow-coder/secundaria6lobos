import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/futuro/Layout";
import {
  Briefcase,
  Building2,
  GraduationCap,
  Hammer,
  Laptop,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Camino = {
  icon: typeof Briefcase;
  titulo: string;
  duracion: string;
  texto: string;
  ventajas: string[];
  aTener: string[];
};

const caminos: Camino[] = [
  {
    icon: GraduationCap,
    titulo: "Universidad",
    duracion: "4 a 6 años",
    texto: "Carreras de grado con título universitario. En Argentina la universidad pública es gratuita y muchas tienen sedes o modalidad a distancia cerca de Lobos.",
    ventajas: ["Título de grado", "Formación amplia", "Acceso a posgrados e investigación"],
    aTener: ["Requiere curso de ingreso o CBC", "Suele implicar viajar o mudarse"],
  },
  {
    icon: Building2,
    titulo: "Instituto terciario",
    duracion: "3 a 4 años",
    texto: "Formación docente y técnica en institutos superiores. Muchos están en ciudades cercanas o en Lobos mismo, con cursada más acotada.",
    ventajas: ["Cerca de casa", "Salida laboral concreta", "Cursada más corta"],
    aTener: ["Título terciario, no universitario", "Cupos limitados en algunas carreras"],
  },
  {
    icon: Hammer,
    titulo: "Formación profesional y oficios",
    duracion: "3 meses a 2 años",
    texto: "Electricidad, gastronomía, soldadura, peluquería, mecánica, instalaciones. Cursos con certificación oficial y rápida inserción laboral.",
    ventajas: ["Rápida salida laboral", "Bajo costo", "Se puede combinar con trabajo"],
    aTener: ["Requiere práctica constante", "Ingresos variables al inicio"],
  },
  {
    icon: Laptop,
    titulo: "Cursos cortos y online",
    duracion: "Semanas a meses",
    texto: "Programación, diseño, idiomas, administración y herramientas digitales. Muchos son gratuitos y con certificado (Argentina Programa, plataformas públicas).",
    ventajas: ["Flexibles", "Gratuitos en muchos casos", "Se hacen desde casa"],
    aTener: ["Requieren mucha autonomía", "No reemplazan un título"],
  },
  {
    icon: Briefcase,
    titulo: "Trabajar y estudiar",
    duracion: "Combinable",
    texto: "Empezar a trabajar mientras cursás una carrera a distancia o de cursada nocturna. Es la opción de muchas y muchos egresados de la escuela.",
    ventajas: ["Ingresos propios", "Experiencia laboral temprana"],
    aTener: ["Exige organización del tiempo", "Puede alargar la carrera"],
  },
  {
    icon: ShieldCheck,
    titulo: "Fuerzas de seguridad y servicio",
    duracion: "1 a 3 años",
    texto: "Escuelas de policía, bomberos, gendarmería, prefectura y fuerzas armadas, con formación rentada y salida laboral asegurada al egresar.",
    ventajas: ["Formación paga", "Estabilidad laboral"],
    aTener: ["Exámenes físicos y psicofísicos", "Régimen de internado en algunos casos"],
  },
  {
    icon: Sparkles,
    titulo: "Tomarte un año para decidir",
    duracion: "1 año",
    texto: "Está bien no tener la respuesta hoy. Un año para trabajar, hacer cursos, viajar o acompañar procesos personales también es una decisión válida.",
    ventajas: ["Menos presión", "Tiempo para explorar intereses"],
    aTener: ["Conviene ponerse metas concretas", "Mantener el hábito de estudio"],
  },
];

function CaminosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Después de la secundaria"
        title="No hay un solo camino correcto"
        description="Cada opción tiene su ritmo, sus requisitos y su salida. Leé con calma, comparalas y hablá con el equipo de orientación de la escuela."
      />
      <section>
        <div className="grid gap-5 md:grid-cols-2">
          {caminos.map((camino) => (
            <article
              key={camino.titulo}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <camino.icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold">{camino.titulo}</h2>
                  <p className="text-xs text-muted-foreground">{camino.duracion}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{camino.texto}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="eyebrow">A favor</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                    {camino.ventajas.map((v) => (
                      <li key={v}>· {v}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow">A tener en cuenta</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                    {camino.aTener.map((v) => (
                      <li key={v}>· {v}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-accent/40 p-8 text-center">
          <h2 className="font-display text-xl font-bold">¿Seguís con dudas?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-accent-foreground/90">
            Hacé el test de orientación: en pocos minutos te sugiere áreas y carreras que pueden ir con tus intereses.
          </p>
          <Link
            to="/tu-futuro/test"
            className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Hacer el test
          </Link>
        </div>
      </section>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/caminos")({
  head: () => ({
    meta: [
      { title: "Qué hacer después de la secundaria | EES N.º 6" },
      {
        name: "description",
        content:
          "Universidad, terciario, formación profesional, oficios, cursos cortos, trabajo o tomarte un año: conocé cada camino con sus requisitos y ventajas.",
      },
      { property: "og:title", content: "Después de la secundaria | EES N.º 6" },
      {
        property: "og:description",
        content: "Todas las opciones posibles al terminar la escuela, explicadas con claridad.",
      },
    ],
  }),
  component: CaminosPage,
});
