import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Briefcase, ClipboardList, GraduationCap, Sparkles, UserRound } from "lucide-react";
import { useEffect } from "react";
import logoAsset from "@/assets/logo.png";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca/")({
  head: () => ({
    meta: [
      { title: "Biblioteca Digital — E.E.S. N.º 6 Lobos" },
      {
        name: "description",
        content:
          "Materiales de estudio, novedades y calendario escolar de la Escuela de Educación Secundaria N.º 6 de Lobos, organizados por año y materia.",
      },
      { property: "og:title", content: "Biblioteca Digital — E.E.S. N.º 6 Lobos" },
      {
        property: "og:description",
        content: "Materiales de estudio organizados por año y materia para estudiantes de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: BibliotecaPortal,
});

const PROFILES = [
  {
    to: "/biblioteca/estudiante",
    icon: GraduationCap,
    title: "Estudiante",
    description: "Materiales, actividades y comunicados de tu año.",
  },
  {
    to: "/biblioteca/acceso",
    icon: UserRound,
    title: "Docente",
    description: "Subí materiales y enviá comunicados a tus cursos.",
  },
  {
    to: "/biblioteca/ingreso/preceptor",
    icon: ClipboardList,
    title: "Preceptor/a",
    description: "Comunicados a cursos y personas, con historial de envíos.",
  },
  {
    to: "/biblioteca/ingreso/directivo",
    icon: Briefcase,
    title: "Directivo/a",
    description: "Comunicación con toda la comunidad educativa.",
  },
] as const;

function BibliotecaPortal() {
  const navigate = useNavigate();
  const { student, teacher, ready } = useBibliotecaSession();

  useEffect(() => {
    if (ready && student) navigate({ to: "/biblioteca/inicio" });
    else if (ready && teacher)
      navigate({
        to: teacher.role === "profesor" ? "/biblioteca/panel" : "/biblioteca/panel/comunicados",
      });
  }, [ready, student, teacher, navigate]);

  return (
    <div className="surface-institutional flex min-h-screen flex-col items-center justify-center px-4 py-12 text-primary-foreground">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoAsset}
            alt="Escudo de la E.E.S. N.º 6"
            className="size-20 rounded-full bg-white/95 p-2 shadow-soft"
          />
          <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Biblioteca Digital</h1>
          <p className="mt-2 text-sm opacity-85 sm:text-base">
            Escuela de Educación Secundaria N.º 6 · Lobos, Buenos Aires
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-card p-5 text-card-foreground shadow-xl sm:p-6">
          <h2 className="font-display text-xl font-semibold">Elegí tu perfil</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada perfil ve solo la información que le corresponde.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {PROFILES.map((p) => (
              <li key={p.to}>
                <Link
                  to={p.to}
                  className="card-lift flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-4 text-left"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <p.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{p.title}</span>
                    <span className="block text-sm text-muted-foreground">{p.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-border pt-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Volver al sitio de la escuela
            </Link>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs opacity-80">
          <Sparkles className="size-3.5" /> Materiales cargados por el equipo docente de la escuela.
        </p>
      </div>
    </div>
  );
}