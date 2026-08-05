import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { becasQuery, formatFecha } from "@/lib/futuro/data";
import { TIPOS_BECA, labelTipoBeca } from "@/lib/futuro/site";

export const Route = createFileRoute("/tu-futuro/becas")({
  head: () => ({
    meta: [
      { title: "Becas | Orientación Estudiantil EES N.º 6" },
      {
        name: "description",
        content:
          "Programas vigentes de becas y apoyos para estudiantes que continúan sus estudios.",
      },
    ],
  }),
  component: BecasPage,
});

function BecasPage() {
  const { data, isLoading } = useQuery(becasQuery);
  const [tipo, setTipo] = useState<string | null>(null);
  const becas = (data ?? []).filter((b) => !tipo || b.tipo === tipo);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow="Becas"
        title="Estudiar también se puede con ayuda económica"
        description="Programas vigentes de becas y apoyos para estudiantes que continúan sus estudios. Verificá siempre las fechas en el sitio oficial de cada programa."
      />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTipo(null)}
            className={
              tipo === null
                ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                : "rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            Todas
          </button>
          {TIPOS_BECA.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(tipo === t.value ? null : t.value)}
              className={
                tipo === t.value
                  ? "rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {becas.map((b) => {
            const vigente = !b.fecha_cierre || b.fecha_cierre >= hoy;
            return (
              <article
                key={b.id}
                className="flex flex-col rounded-xl border border-border bg-card p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold text-accent-foreground">
                    {labelTipoBeca(b.tipo)}
                  </span>
                  <span
                    className={
                      vigente
                        ? "rounded-full border border-primary/40 px-3 py-1 text-[0.7rem] font-medium text-primary"
                        : "rounded-full border border-border px-3 py-1 text-[0.7rem] text-muted-foreground"
                    }
                  >
                    {vigente ? "Convocatoria vigente" : "Cerrada por ahora"}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold">{b.nombre}</h2>
                {b.descripcion && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {b.descripcion}
                  </p>
                )}
                {b.requisitos && (
                  <p className="mt-3 text-sm leading-relaxed">
                    <span className="font-semibold">Requisitos: </span>
                    <span className="text-muted-foreground">{b.requisitos}</span>
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {b.fecha_inicio || b.fecha_cierre
                    ? `Inscripción: ${formatFecha(b.fecha_inicio)} — ${formatFecha(b.fecha_cierre)}`
                    : "Fechas a confirmar por el organismo"}
                </div>
                {b.enlace_oficial && (
                  <a
                    href={b.enlace_oficial}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-primary hover:underline"
                  >
                    Sitio oficial <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </article>
            );
          })}
        </div>

        {!isLoading && becas.length === 0 && (
          <div className="mt-8">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No hay becas cargadas para este filtro.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
