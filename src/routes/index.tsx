import { createFileRoute, Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GraduationCap, Rocket, Building2, Banknote, Compass, Map, ArrowRight } from "lucide-react";
import { Lobi } from "@/components/Lobi";
import { Intro, hasSeenIntro } from "@/components/Intro";
import { AppBottomNav } from "@/components/AppBottomNav";
import { loadSiteContent } from "@/lib/site.functions";
import {
  SECTION_LABELS,
  defaultContent,
  visible,
  type SectionKey,
  type SiteContent,
} from "@/lib/site-content";

export const Route = createFileRoute("/")({
  loader: () => loadSiteContent(),
  component: Index,
});

const ContentCtx = createContext<SiteContent>(defaultContent);
const useContent = () => useContext(ContentCtx);

function Index() {
  const content = Route.useLoaderData() as SiteContent;
  const [showIntro, setShowIntro] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hasSeenIntro()) setShowIntro(false);
    setChecked(true);
  }, []);

  if (!checked) {
    return <div className="min-h-screen bg-black" />;
  }

  const sections = (content.sections?.order ?? defaultContent.sections.order).filter(
    (s) => !s.hidden,
  );

  const RENDERERS: Record<SectionKey, () => React.ReactNode> = {
    inicio: () => <Hero key="inicio" />,
    tufuturo: () => <TuFuturo key="tufuturo" />,
    escuela: () => <About key="escuela" />,
    galeria: () => <Gallery key="galeria" />,
    aniversario: () => <Anniversary key="aniversario" />,
    noticias: () => <News key="noticias" />,
    eventos: () => <Events key="eventos" />,
    redes: () => <SocialNetworks key="redes" />,
    multimedia: () => <Multimedia key="multimedia" />,
    proximamente: () => <ComingSoon key="proximamente" />,
    contacto: () => <Contact key="contacto" />,
  };

  return (
    <ContentCtx.Provider value={content}>
      <div className="min-h-screen bg-background text-foreground">
        {showIntro && <Intro onDone={() => setShowIntro(false)} />}
        <Header nav={sections.map((s) => ({ href: `#${s.key}`, label: SECTION_LABELS[s.key] ?? s.label }))} />
        {sections.map((s) => RENDERERS[s.key]?.())}
        <Footer />
        <Lobi />
        <BackToTop />
        <AppBottomNav />
      </div>
    </ContentCtx.Provider>
  );
}

function Header({ nav }: { nav: { href: string; label: string }[] }) {
  const { school } = useContent();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#inicio" className="flex min-w-0 items-center gap-3">
          <img src={school.logo} alt="Logo EES N.º 6" className="h-12 w-12 shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold text-brand-navy sm:text-base">
              {school.shortName}
            </div>
            <div className="truncate text-xs text-muted-foreground">Lobos, Bs. As.</div>
          </div>
        </a>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-brand-sky/30 hover:text-brand-navy"
            >
              {n.label}
            </a>
          ))}
          <Link
            to="/admin"
            className="ml-1 rounded-full border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-brand-sky/30 hover:text-brand-navy"
          >
            Panel
          </Link>
          <a
            href="/biblioteca"
            className="ml-1 rounded-full bg-brand-navy px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Biblioteca Digital
          </a>
        </nav>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-border p-2 lg:hidden"
          aria-label="Menú"
        >
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="block h-0.5 w-5 bg-foreground" />
          </div>
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/85 hover:bg-brand-sky/30"
              >
                {n.label}
              </a>
            ))}
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand-sky/30"
            >
              Panel de Administración
            </Link>
            <a
              href="/biblioteca"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-brand-navy px-3 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Biblioteca Digital
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { school, hero } = useContent();
  const years = new Date().getFullYear() - hero.badgeYear;
  return (
    <section id="inicio" className="relative overflow-hidden bg-gradient-cosmic">
      <div className="absolute inset-0 bg-gradient-cosmic" aria-hidden />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-24 text-center text-primary-foreground sm:px-6 sm:py-32">
        <img
          src={school.logo}
          alt="Logo EES N.º 6"
          className="animate-float h-32 w-32 object-contain drop-shadow-2xl sm:h-40 sm:w-40"
        />
        <div className="animate-fade-up space-y-4">
          <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ring-1 ring-white/30">
            Desde {hero.badgeYear} · {years} {years === 1 ? "año" : "años"} formando comunidad · Lobos, Buenos Aires
          </span>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">{hero.title}</h1>
          <p className="mx-auto max-w-2xl text-base text-white/85 sm:text-lg">{hero.subtitle}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="#escuela"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-elegant transition hover:scale-105"
          >
            {hero.primaryCta}
          </a>
          <a
            href="#contacto"
            className="rounded-full border-2 border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {hero.secondaryCta}
          </a>
        </div>
      </div>
    </section>
  );
}

/** Sección "Tu Futuro" — plataforma de orientación integrada dentro del mismo sitio. */
function TuFuturo() {
  const items = [
    { icon: GraduationCap, label: "Carreras", to: "/tu-futuro/carreras" },
    { icon: Building2, label: "Universidades", to: "/tu-futuro/instituciones" },
    { icon: Banknote, label: "Becas", to: "/tu-futuro/becas" },
    { icon: Compass, label: "Orientación", to: "/tu-futuro/test" },
    { icon: Map, label: "Mapa educativo", to: "/tu-futuro/mapa" },
  ];

  return (
    <section id="tufuturo" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="group relative overflow-hidden rounded-3xl bg-gradient-hero p-6 shadow-elegant ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-10 lg:p-12">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-sky ring-1 ring-white/20">
              <Rocket className="h-4 w-4" />
              Proyecto institucional
            </div>
            <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">Tu Futuro</h2>
            <p className="text-base text-white/90 sm:text-lg">
              Descubrí carreras, universidades, becas y oportunidades para planificar tu futuro
              académico y profesional.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-white/75">
              Una plataforma desarrollada por la escuela para acompañar a los estudiantes en la
              búsqueda de información sobre universidades, institutos, formación profesional, becas
              y oportunidades cercanas a Lobos.
            </p>
            <Link
              to="/tu-futuro"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-[1.03]"
            >
              Explorar Tu Futuro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex shrink-0 justify-center lg:justify-end">
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-white/10 text-white/80 ring-1 ring-white/20 backdrop-blur-sm sm:h-32 sm:w-32">
              <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => (
            <Link
              key={it.label}
              to={it.to}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-primary-foreground ring-1 ring-white/10 transition-colors hover:bg-white/20"
            >
              <it.icon className="h-5 w-5 shrink-0 text-brand-sky" />
              <span className="text-sm font-medium">{it.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const { history, school } = useContent();
  return (
    <section id="escuela" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionTitle eyebrow={history.eyebrow} title={history.title} />
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/85">{history.intro}</p>

      <ol className="relative mt-10 space-y-6 border-l-2 border-brand-sky/60 pl-6">
        {history.timeline.map((t) => (
          <li key={t.date + t.title} className="relative">
            <span className="absolute -left-[34px] top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-navy text-[10px] font-bold text-primary-foreground ring-4 ring-background">
              ●
            </span>
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-sky">{t.date}</div>
              <h3 className="mt-1 text-lg font-bold text-brand-navy">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">{t.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl bg-brand-sky/20 p-6 text-center text-brand-navy shadow-card">
        <p className="text-base font-medium leading-relaxed">{history.closing}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-card p-8 shadow-card">
          <div className="flex flex-wrap gap-6 text-sm">
            <Stat label="Localidad" value={school.city} />
            <Stat label="Dirección" value={school.address} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard title="Misión" body={history.mission} tone="navy" />
          <InfoCard title="Visión" body={history.vision} tone="sky" />
          <div className="rounded-3xl bg-card p-6 shadow-card sm:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-brand-navy">Nuestros valores</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {history.values.map((v) => (
                <div key={v.title} className="flex gap-3 rounded-xl bg-brand-sky/20 p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-navy text-xs font-bold text-primary-foreground">
                    ✓
                  </div>
                  <div>
                    <div className="font-semibold text-brand-navy">{v.title}</div>
                    <div className="text-sm text-muted-foreground">{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-brand-navy">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function InfoCard({ title, body, tone }: { title: string; body: string; tone: "navy" | "sky" }) {
  const cls =
    tone === "navy" ? "bg-brand-navy text-primary-foreground" : "bg-brand-sky text-brand-navy";
  return (
    <div className={`rounded-3xl p-6 shadow-card ${cls}`}>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed opacity-95">{body}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  center = false,
}: {
  eyebrow: string;
  title: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sky">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-extrabold text-brand-navy sm:text-4xl">{title}</h2>
      <div className="mt-3 h-1 w-16 rounded-full bg-gradient-brand" />
    </div>
  );
}

function Gallery() {
  const { gallery } = useContent();
  const items = useMemo(() => visible(gallery.items), [gallery.items]);
  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(items.map((g) => g.category)))],
    [items],
  );
  const [active, setActive] = useState("Todas");
  const shown = items.filter((g) => active === "Todas" || g.category === active);
  return (
    <section id="galeria" className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Galería" title="Momentos de nuestra comunidad" />
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active === c
                  ? "bg-brand-navy text-primary-foreground shadow-card"
                  : "bg-card text-foreground/80 hover:bg-brand-sky/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((g) => (
            <article
              key={g.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={g.url}
                  alt={g.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-sky">
                  {g.category}
                </div>
                <h3 className="mt-2 text-base font-bold leading-snug text-brand-navy">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Anniversary() {
  const { anniversary } = useContent();
  return (
    <section id="aniversario" className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow={anniversary.eyebrow} title={anniversary.title} />
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/85">
          {anniversary.text}
        </p>
      </div>
    </section>
  );
}

function News() {
  const { news } = useContent();
  return (
    <section id="noticias" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionTitle eyebrow="Noticias" title="Últimas novedades" />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible(news.items).map((n) => (
          <article
            key={n.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="aspect-video overflow-hidden">
              <img src={n.image} alt={n.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-sky">
                {n.date}
              </div>
              <h3 className="mt-1 text-lg font-bold text-brand-navy">{n.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{n.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Events() {
  const { events } = useContent();
  return (
    <section id="eventos" className="bg-gradient-hero py-20 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-sky">Eventos</div>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Calendario escolar</h2>
        <div className="mt-3 h-1 w-16 rounded-full bg-white/70" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible(events.items).map((e) => (
            <div
              key={e.id}
              className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
            >
              <div className="text-3xl font-extrabold text-white">{e.date}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-brand-sky">
                {e.type}
              </div>
              <div className="mt-1 font-semibold">{e.title}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialNetworks() {
  const { school } = useContent();
  return (
    <section id="redes" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionTitle eyebrow="Seguinos" title="Nuestras redes" center />
      <div className="mt-10 flex flex-wrap justify-center gap-6">
        <a
          href={school.facebook}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-[180px] items-center justify-center gap-3 rounded-2xl bg-[#1877F2] px-6 py-4 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant"
          aria-label="Facebook"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </a>
        <a
          href={school.instagram}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-[180px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] px-6 py-4 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant"
          aria-label="Instagram"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Instagram
        </a>
      </div>
    </section>
  );
}

function Multimedia() {
  const { videos } = useContent();
  return (
    <section id="multimedia" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionTitle eyebrow="Multimedia" title="Videos institucionales" />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {visible(videos.items).map((v) => (
          <div key={v.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
            <video
              src={v.url}
              controls
              className="aspect-video w-full bg-black object-contain"
              preload="metadata"
            />
            <div className="p-4">
              <div className="font-semibold text-brand-navy">{v.title}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  const { school } = useContent();
  return (
    <section id="contacto" className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Contacto" title="Cómo encontrarnos" />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <ContactItem icon="🏫" label="Institución" value={school.name} />
            <ContactItem icon="📍" label="Dirección" value={`${school.address}, ${school.city}`} />
            <ContactItem icon="📞" label="Teléfono" value={school.phone} />
            <ContactItem icon="✉️" label="Correo" value={school.email} />
            <ContactItem
              icon="📷"
              label="Instagram"
              value={school.instagramHandle}
              href={school.instagram}
            />
            <HoursCard />
          </div>
          <div className="overflow-hidden rounded-2xl shadow-card">
            <iframe
              title="Mapa EES N.º 6"
              src={school.mapEmbed}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-card transition hover:-translate-y-0.5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-sky/40 text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 break-words font-semibold text-brand-navy">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}

function HoursCard() {
  const { school } = useContent();
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-sky/40 text-xl">
          🕒
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Horarios
          </div>
          <div className="mt-2 space-y-2 text-sm text-foreground/85">
            <div>
              <div className="font-semibold text-brand-navy">Ingreso</div>
              <div>{school.hours.entryGeneral}</div>
              <div className="text-muted-foreground">{school.hours.entryException}</div>
            </div>
            <div>
              <div className="font-semibold text-brand-navy">Salida</div>
              <div>{school.hours.exitGeneral}</div>
              {school.hours.exitExceptions.map((e) => (
                <div key={e} className="text-muted-foreground">
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const { school } = useContent();
  return (
    <footer className="bg-brand-navy text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex items-center gap-4">
          <img src={school.logo} alt="Logo" className="h-14 w-14 object-contain" />
          <div>
            <div className="font-bold">{school.shortName}</div>
            <div className="text-sm opacity-80">Lobos, Buenos Aires</div>
          </div>
        </div>
        <div className="text-sm opacity-90">
          <div className="font-semibold text-white">Contacto</div>
          <div className="mt-2">{school.address}</div>
          <div>{school.city}</div>
          <div>{school.phone}</div>
          <div>{school.email}</div>
        </div>
        <div className="text-sm opacity-90">
          <div className="font-semibold text-white">Seguinos</div>
          <a
            href={school.facebook}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block hover:text-brand-sky"
          >
            Facebook {school.facebookHandle}
          </a>
          <a
            href={school.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block hover:text-brand-sky"
          >
            Instagram {school.instagramHandle}
          </a>
          <div className="mt-4 text-xs opacity-70">
            © {new Date().getFullYear()} {school.name}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}

function ComingSoon() {
  const { comingSoon } = useContent();
  return (
    <section id="proximamente" className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle eyebrow="Próximamente" title="Novedades en camino" center />
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-foreground/80">
          {comingSoon.intro}
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible(comingSoon.items).map((it) => (
            <div
              key={it.id}
              className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-card ring-1 ring-border/50 transition hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="absolute right-4 top-4 rounded-full bg-brand-sky/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                Pronto
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-navy text-2xl text-primary-foreground">
                {it.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-brand-navy">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BackToTop() {
  const [visibleBtn, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className={`fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-brand-navy text-primary-foreground shadow-elegant ring-1 ring-white/20 transition-all duration-500 hover:scale-110 hover:bg-brand-sky hover:text-brand-navy sm:bottom-6 sm:right-6 ${
        visibleBtn ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
