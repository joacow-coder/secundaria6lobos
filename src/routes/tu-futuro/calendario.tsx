import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { eventosQuery, formatFecha, type Evento } from "@/lib/futuro/data";
import { labelCategoriaEvento } from "@/lib/futuro/site";

export const Route = createFileRoute("/tu-futuro/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario | Orientación Estudiantil EES N.º 6" },
      {
        name: "description",
        content:
          "Inscripciones, exámenes de ingreso, cierres de becas y charlas. Las fechas pueden cambiar: confirmá siempre en el sitio oficial.",
      },
    ],
  }),
  component: CalendarioPage,
});

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function CalendarioPage() {
  const { data, isLoading } = useQuery(eventosQuery);
  const hoy = new Date().toISOString().slice(0, 10);
  const eventos = data ?? [];
  const grupos = eventos.reduce<Record<string, Evento[]>>((acc, e) => {
    const [anio, mes] = e.fecha_inicio?.split("-") ?? [];
    const clave = `${MESES[Number(mes) - 1]} ${anio}`;
    (acc[clave] ??= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Calendario"
        title="Fechas que no se pueden pasar por alto"
        description="Inscripciones, exámenes de ingreso, cierres de becas y charlas. Las fechas pueden cambiar: confirmá siempre en el sitio oficial."
      />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Cargando calendario…</p>
        )}
        <div className="grid gap-10">
          {Object.entries(grupos).map(([mes, items]) => (
            <div key={mes}>
              <h2 className="font-display text-xl font-bold capitalize">{mes}</h2>
              <ul className="mt-4 grid gap-3">
                {items.map((e) => (
                  <li
                    key={e.id}
                    className={
                      (e.fecha_fin ?? e.fecha_inicio ?? "") < hoy
                        ? "rounded-xl border border-border bg-muted/40 p-5 opacity-70"
                        : "rounded-xl border border-border bg-card p-5"
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 text-[0.7rem] font-semibold text-accent-foreground">
                        {labelCategoriaEvento(e.categoria)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFecha(e.fecha_inicio)}
                        {e.fecha_fin && e.fecha_fin !== e.fecha_inicio
                          ? ` — ${formatFecha(e.fecha_fin)}`
                          : ""}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-base font-semibold">{e.titulo}</h3>
                    {e.descripcion && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {e.descripcion}
                      </p>
                    )}
                    {e.enlace && (
                      <a
                        href={e.enlace}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        Más información <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {!isLoading && eventos.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía no hay fechas cargadas para este ciclo lectivo.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
