import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { futuroNav, futuroSite } from "@/lib/futuro/site";
import { registrarVisita, setUltimaSeccion } from "@/lib/futuro/store";
import { IntroWelcome } from "@/components/futuro/IntroWelcome";

function useTracking() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const match = futuroNav.find((n) => pathname.startsWith(n.to));
    if (match) setUltimaSeccion(match.to, match.label);
    else if (pathname.startsWith("/tu-futuro/instituciones"))
      setUltimaSeccion("/tu-futuro/instituciones", "Instituciones");
  }, [pathname]);
  useEffect(() => {
    registrarVisita();
  }, []);
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/tu-futuro" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <img src={futuroSite.logo} alt="Logo de la EES N.º 6" className="h-10 w-10 object-contain" />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold leading-tight text-foreground">
              Orientación Estudiantil
            </span>
            <span className="block truncate text-xs text-muted-foreground">EES N.º 6 · Lobos</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {futuroNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-2.5 py-2 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            ← Sitio de la escuela
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:px-6">
            {futuroNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                activeProps={{ className: "bg-muted" }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              ← Sitio de la escuela
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={futuroSite.logo} alt="" className="h-11 w-11 object-contain" />
            <div>
              <p className="font-display text-sm font-semibold">{futuroSite.escuela}</p>
              <p className="text-xs text-muted-foreground">{futuroSite.ciudad}</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Plataforma de orientación creada por la escuela para acompañar a sus estudiantes en la
            elección de su futuro académico y profesional.
          </p>
        </div>

        <div>
          <p className="eyebrow">Secciones</p>
          <ul className="mt-4 grid gap-2 text-sm">
            {futuroNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Contacto</p>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>{futuroSite.direccion}</li>
            <li>{futuroSite.contacto}</li>
            <li>
              <Link to="/" className="hover:text-foreground">
                Sitio institucional de la escuela
              </Link>
            </li>
            <li>
              <Link to="/tu-futuro/compartir" className="hover:text-foreground">
                Compartir esta herramienta / QR
              </Link>
            </li>
            <li>
              <Link to="/tu-futuro/auth" className="hover:text-foreground">
                Acceso administradores
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {futuroSite.escuela} — Lobos, Buenos Aires
      </div>
    </footer>
  );
}

export function FuturoLayout({ children }: { children: ReactNode }) {
  useTracking();
  return (
    <div className="flex min-h-screen flex-col">
      <IntroWelcome />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </section>
  );
}
