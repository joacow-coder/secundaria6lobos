import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

/** Encabezado de pantalla con botón para volver y acceso al inicio. */
export function ScreenHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  const router = useRouter();
  return (
    <header className="bg-gradient-cosmic text-primary-foreground">
      <div className="mx-auto max-w-5xl px-4 pt-4 pb-10 sm:px-6 sm:pt-6 sm:pb-14">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ArrowLeft className="size-4" /> Volver
          </button>
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <Home className="size-4" /> Inicio
          </Link>
        </div>
        <div className="mt-7">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-brand-sky">{eyebrow}</div>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
