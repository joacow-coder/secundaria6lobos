import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { carrerasQuery } from "@/lib/futuro/data";
import { guardarResultadoTest } from "@/lib/futuro/store";

type Pregunta = {
  texto: string;
  opciones: { label: string; areas: string[] }[];
};

const preguntas: Pregunta[] = [
  {
    texto: "Cuando tenés tiempo libre, ¿qué te sale hacer casi sin pensarlo?",
    opciones: [
      { label: "Armar, reparar o desarmar cosas", areas: ["Ingeniería", "Oficios"] },
      { label: "Dibujar, escribir, tocar música o filmar", areas: ["Arte", "Diseño"] },
      { label: "Investigar temas que me generan curiosidad", areas: ["Ciencias", "Tecnología"] },
      { label: "Estar con gente, charlar y ayudar", areas: ["Educación", "Salud"] },
    ],
  },
  {
    texto: "¿Qué materia de la escuela te resulta más llevadera?",
    opciones: [
      { label: "Matemática y Física", areas: ["Ingeniería", "Tecnología"] },
      { label: "Biología y Química", areas: ["Salud", "Ciencias"] },
      { label: "Literatura e Historia", areas: ["Comunicación", "Derecho"] },
      { label: "Economía y Administración", areas: ["Economía"] },
    ],
  },
  {
    texto: "¿Cómo te sentís más cómodo trabajando?",
    opciones: [
      { label: "Solo, concentrado en una tarea", areas: ["Tecnología", "Diseño"] },
      { label: "En equipo, coordinando con otros", areas: ["Educación", "Economía"] },
      { label: "Atendiendo y acompañando personas", areas: ["Salud", "Educación"] },
      { label: "Con las manos, en movimiento", areas: ["Oficios", "Ingeniería"] },
    ],
  },
  {
    texto: "Un problema que te gustaría ayudar a resolver:",
    opciones: [
      { label: "Que la gente acceda mejor a la salud", areas: ["Salud"] },
      { label: "Que la educación llegue a todos", areas: ["Educación"] },
      { label: "Que la tecnología resuelva cosas cotidianas", areas: ["Tecnología", "Ingeniería"] },
      { label: "Que se respeten los derechos de las personas", areas: ["Derecho", "Comunicación"] },
    ],
  },
  {
    texto: "¿Qué tipo de tarea te aburre menos?",
    opciones: [
      { label: "Resolver cálculos y problemas lógicos", areas: ["Ingeniería", "Economía"] },
      { label: "Crear algo visual o estético", areas: ["Diseño", "Arte"] },
      { label: "Leer, redactar y argumentar", areas: ["Derecho", "Comunicación"] },
      { label: "Experimentar y tomar datos", areas: ["Ciencias", "Salud"] },
    ],
  },
  {
    texto: "¿Cuánto tiempo estás dispuesto a estudiar?",
    opciones: [
      { label: "Lo menos posible, quiero trabajar pronto", areas: ["Oficios", "Tecnología"] },
      { label: "Tres o cuatro años está bien", areas: ["Educación", "Diseño"] },
      { label: "Cinco años o más si vale la pena", areas: ["Salud", "Ingeniería", "Derecho"] },
      { label: "No me importa, si me gusta lo hago", areas: ["Ciencias", "Arte"] },
    ],
  },
  {
    texto: "¿Dónde te imaginás trabajando?",
    opciones: [
      { label: "Un taller, una obra o el campo", areas: ["Oficios", "Ingeniería"] },
      { label: "Un hospital, centro de salud o consultorio", areas: ["Salud"] },
      { label: "Una escuela o espacio comunitario", areas: ["Educación"] },
      { label: "Una oficina, estudio o desde casa", areas: ["Economía", "Tecnología", "Diseño"] },
    ],
  },
  {
    texto: "Tus amigos te piden ayuda sobre todo para…",
    opciones: [
      { label: "Arreglar el celular o la computadora", areas: ["Tecnología"] },
      { label: "Escuchar y dar consejos", areas: ["Salud", "Educación"] },
      { label: "Organizar cosas y cuentas", areas: ["Economía"] },
      { label: "Hacer un video, un cartel o una idea creativa", areas: ["Diseño", "Comunicación"] },
    ],
  },
  {
    texto: "¿Qué te motiva más de un futuro trabajo?",
    opciones: [
      { label: "Ganar bien", areas: ["Economía", "Ingeniería", "Tecnología"] },
      { label: "Ayudar a otros", areas: ["Salud", "Educación"] },
      { label: "Expresarme y crear", areas: ["Arte", "Diseño"] },
      { label: "Descubrir y entender cómo funcionan las cosas", areas: ["Ciencias"] },
    ],
  },
  {
    texto: "Frente a una situación injusta, ¿qué hacés?",
    opciones: [
      { label: "Busco la norma o el modo formal de reclamar", areas: ["Derecho"] },
      { label: "Lo cuento y lo hago visible", areas: ["Comunicación"] },
      { label: "Organizo a la gente para resolverlo", areas: ["Educación", "Economía"] },
      { label: "Busco una solución técnica concreta", areas: ["Ingeniería", "Tecnología"] },
    ],
  },
];

function TestPage() {
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const carreras = useQuery(carrerasQuery);
  const completo = Object.keys(respuestas).length === preguntas.length;

  const areasTop = useMemo(() => {
    const conteo: Record<string, number> = {};
    Object.entries(respuestas).forEach(([preguntaIndex, opcionIndex]) => {
      preguntas[Number(preguntaIndex)]?.opciones[opcionIndex]?.areas.forEach((area) => {
        conteo[area] = (conteo[area] ?? 0) + 1;
      });
    });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [respuestas]);

  useEffect(() => {
    if (completo) guardarResultadoTest(areasTop.map(([area]) => area));
  }, [completo, areasTop]);

  const carrerasSugeridas = (carreras.data ?? [])
    .filter((carrera) => areasTop.some(([area]) => area === carrera.area))
    .slice(0, 8);
  const progreso = Math.round((Object.keys(respuestas).length / preguntas.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Test vocacional"
        title="No sé qué estudiar"
        description="Diez preguntas rápidas. El resultado es orientativo: sirve para abrir puertas, no para cerrarlas. Después charlalo con el equipo de orientación."
      />
      <section className="max-w-3xl">
        <div className="sticky top-[4.5rem] z-10 -mx-4 bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="brand-gradient h-full rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Object.keys(respuestas).length} de {preguntas.length} respondidas
          </p>
        </div>

        <div className="mt-8 grid gap-6">
          {preguntas.map((pregunta, preguntaIndex) => (
            <fieldset key={pregunta.texto} className="rounded-xl border border-border bg-card p-6">
              <legend className="px-1 text-xs font-semibold text-primary">
                Pregunta {preguntaIndex + 1}
              </legend>
              <p className="font-display text-base font-semibold leading-snug">{pregunta.texto}</p>
              <div className="mt-4 grid gap-2">
                {pregunta.opciones.map((opcion, opcionIndex) => (
                  <button
                    key={opcion.label}
                    type="button"
                    onClick={() =>
                      setRespuestas((prev) => ({ ...prev, [preguntaIndex]: opcionIndex }))
                    }
                    className={
                      respuestas[preguntaIndex] === opcionIndex
                        ? "rounded-lg border border-primary bg-accent px-4 py-3.5 text-left text-sm font-medium text-accent-foreground"
                        : "rounded-lg border border-border px-4 py-3.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    }
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {completo && (
          <div className="mt-10 rounded-2xl border border-primary/30 bg-accent/40 p-8">
            <h2 className="font-display text-xl font-bold">Tus áreas más afines</h2>
            <ul className="mt-4 grid gap-3">
              {areasTop.map(([area, cantidad], index) => (
                <li key={area} className="rounded-lg bg-background p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-display text-base font-semibold">
                      {index + 1}. {area}
                    </span>
                    <span className="text-xs text-muted-foreground">{cantidad} coincidencias</span>
                  </div>
                </li>
              ))}
            </ul>

            {carrerasSugeridas.length > 0 && (
              <>
                <h3 className="mt-8 font-display text-base font-bold">Carreras cercanas relacionadas</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {carrerasSugeridas.map((carrera) => (
                    <div key={carrera.id} className="rounded-lg bg-background p-4">
                      <p className="text-sm font-semibold">{carrera.nombre}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {carrera.instituciones?.nombre ?? "Institución a confirmar"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tu-futuro/carreras"
                className="inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Ver todas las carreras
              </Link>
              <button
                type="button"
                onClick={() => setRespuestas({})}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" /> Rehacer el test
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/test")({
  head: () => ({
    meta: [
      { title: "Test de orientación vocacional | EES N.º 6" },
      {
        name: "description",
        content:
          "Test vocacional breve y orientativo: respondé 10 preguntas y descubrí qué áreas de estudio pueden ir con tus intereses, con carreras sugeridas cerca de Lobos.",
      },
      { property: "og:title", content: "Test de orientación vocacional | EES N.º 6" },
      {
        property: "og:description",
        content: "10 preguntas para descubrir áreas y carreras que pueden interesarte.",
      },
    ],
  }),
  component: TestPage,
});
