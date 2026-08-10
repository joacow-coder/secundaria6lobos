import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppBottomNav } from "@/components/AppBottomNav";
import { loadSiteContent } from "@/lib/site.functions";
import type { SiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/institucion")({
  loader: () => loadSiteContent(),
  head: () => ({
    meta: [
      { title: "Institución — EES N.º 6 Lobos" },
      {
        name: "description",
        content:
          "Misión, visión, valores, horarios y datos de contacto de la Escuela de Educación Secundaria N.º 6 de Lobos.",
      },
      { property: "og:title", content: "Institución — EES N.º 6 Lobos" },
      {
        property: "og:description",
        content: "Misión, visión, valores, horarios y contacto de la EES N.º 6 de Lobos.",
      },
    ],
  }),
  component: InstitucionScreen,
});

function InstitucionScreen() {
  const { history, school } = Route.useLoaderData() as SiteContent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader
        eyebrow="Institución"
        title={school.name}
        description="Quiénes somos, cómo trabajamos y cómo comunicarte con la escuela."
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-brand-navy p-6 text-primary-foreground shadow-card">
            <h2 className="mb-2 text-lg font-bold">Misión</h2>
            <p className="text-sm leading-relaxed opacity-95">{history.mission}</p>
          </div>
          <div className="rounded-3xl bg-brand-sky p-6 text-brand-navy shadow-card">
            <h2 className="mb-2 text-lg font-bold">Visión</h2>
            <p className="text-sm leading-relaxed opacity-95">{history.vision}</p>
          </div>
        </div>

        <section className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-brand-navy">Nuestros valores</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {history.values.map((v) => (
              <div key={v.title} className="flex gap-3 rounded-xl bg-brand-sky/20 p-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-navy text-xs font-bold text-primary-foreground">
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-brand-navy">{v.title}</div>
                  <div className="text-sm text-muted-foreground">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-brand-navy">
            <Clock className="size-5" /> Horarios
          </h2>
          <ul className="space-y-2 text-sm text-foreground/85">
            <li>
              <strong>Ingreso:</strong> {school.hours.entryGeneral}
            </li>
            <li className="text-muted-foreground">{school.hours.entryException}</li>
            <li className="pt-2">
              <strong>Salida:</strong> {school.hours.exitGeneral}
            </li>
            {school.hours.exitExceptions.map((e) => (
              <li key={e} className="text-muted-foreground">
                {e}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-brand-navy">Contacto</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-sky" />
              <span>
                {school.address} — {school.city}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-sky" />
              <a href={`tel:${school.phone.replace(/[^0-9+]/g, "")}`} className="hover:underline">
                {school.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand-sky" />
              <a href={`mailto:${school.email}`} className="break-all hover:underline">
                {school.email}
              </a>
            </li>
          </ul>
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
}
