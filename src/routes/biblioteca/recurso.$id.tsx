import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Download,
  ExternalLink,
  Eye,
  Heart,
  Tag,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { ResourceCard } from "@/components/biblioteca/ResourceCard";
import { fileUrl, resourcesQuery, subjectsQuery } from "@/lib/biblioteca/data";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { bibTrackMetric } from "@/lib/biblioteca/teacher.functions";
import { KIND_LABELS, formatDate, formatFileSize, toEmbedUrl, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/recurso/$id")({
  head: () => ({
    meta: [
      { title: "Material — Biblioteca Digital E.E.S. N.º 6" },
      { name: "description", content: "Detalle y vista previa de un material de estudio." },
      { property: "og:title", content: "Material — Biblioteca Digital E.E.S. N.º 6" },
      { property: "og:description", content: "Detalle y vista previa de un material de estudio." },
    ],
  }),
  component: RecursoDetalle,
});

function RecursoDetalle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { student, teacher, ready, favorites, toggleFavorite, markRecent } = useBibliotecaSession();

  useEffect(() => {
    if (ready && !student && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, student, teacher, navigate]);

  const { data: resources = [] } = useQuery(resourcesQuery);
  const { data: subjects = [] } = useQuery(subjectsQuery);
  const trackMetric = useMutation({
    mutationFn: (metric: "views" | "downloads") => bibTrackMetric({ data: { id, metric } }),
  });

  const resource = resources.find((r) => r.id === id);
  const subject = subjects.find((s) => s.code === resource?.subject_code);

  const tracked = useRef(false);
  useEffect(() => {
    if (!resource || tracked.current) return;
    tracked.current = true;
    trackMetric.mutate("views");
    markRecent(resource.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource?.id]);

  const related = useMemo(
    () =>
      resource
        ? resources.filter((r) => r.subject_code === resource.subject_code && r.id !== resource.id).slice(0, 3)
        : [],
    [resource, resources],
  );

  if (!ready || (!student && !teacher)) {
    return (
      <AppShell area="alumno">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  if (!resource) {
    return (
      <AppShell area="alumno">
        <EmptyState
          icon={Eye}
          title="No encontramos este material"
          description="Puede que haya sido eliminado o que el enlace sea incorrecto."
        />
      </AppShell>
    );
  }

  const isFavorite = favorites.includes(resource.id);
  const embedUrl = resource.external_url ? toEmbedUrl(resource.external_url) : null;
  const isPdf = resource.file_path && (resource.mime_type ?? "").includes("pdf");
  const isImage = resource.file_path && (resource.mime_type ?? "").startsWith("image/");

  function handleDownload() {
    trackMetric.mutate("downloads");
  }

  return (
    <AppShell area="alumno">
      <div className="flex flex-col gap-6">
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <a href="/biblioteca/inicio" className="hover:text-foreground">
            Inicio
          </a>{" "}
          /{" "}
          <a href={`/biblioteca/materia/${resource.subject_code}`} className="hover:text-foreground">
            {subject?.name ?? resource.subject_code}
          </a>{" "}
          / <span className="text-foreground">{resource.title}</span>
        </nav>

        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="w-fit rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {KIND_LABELS[resource.kind] ?? KIND_LABELS["otro"]}
              </span>
              <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{resource.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {subject?.name ?? resource.subject_code} · {yearLabel(resource.year)}
                {resource.unit ? ` · ${resource.unit}` : ""}
                {resource.topic ? ` · ${resource.topic}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite(resource.id)}
              aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border hover:bg-secondary"
            >
              <Heart className={isFavorite ? "size-5 fill-accent text-accent" : "size-5 text-muted-foreground"} />
            </button>
          </div>

          <p className="text-sm text-foreground/90">{resource.description}</p>

          {resource.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  <Tag className="size-3" /> {tag}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Docente</dt>
              <dd className="flex items-center gap-1.5 font-medium">
                <User className="size-3.5" /> {resource.teacher_name}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Publicado</dt>
              <dd className="flex items-center gap-1.5 font-medium">
                <Calendar className="size-3.5" /> {formatDate(resource.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tamaño</dt>
              <dd className="font-medium">{formatFileSize(resource.file_size)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vistas / descargas</dt>
              <dd className="flex items-center gap-1.5 font-medium">
                <Eye className="size-3.5" /> {resource.views} · <Download className="size-3.5" /> {resource.downloads}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {resource.file_path ? (
              <>
                <a
                  href={fileUrl(resource.file_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Eye className="size-4" /> Ver
                </a>
                <a
                  href={fileUrl(resource.file_path, true)}
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/70"
                >
                  <Download className="size-4" /> Descargar
                </a>
              </>
            ) : resource.external_url ? (
              <a
                href={resource.external_url}
                target="_blank"
                rel="noreferrer"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="size-4" /> Abrir enlace
              </a>
            ) : null}
          </div>

          {isPdf ? (
            <iframe
              title={resource.title}
              src={fileUrl(resource.file_path!)}
              className="h-[70vh] w-full rounded-lg border border-border"
            />
          ) : isImage ? (
            <img
              src={fileUrl(resource.file_path!)}
              alt={resource.title}
              className="max-h-[70vh] w-full rounded-lg border border-border object-contain"
            />
          ) : embedUrl ? (
            <iframe
              title={resource.title}
              src={embedUrl}
              className="h-[60vh] w-full rounded-lg border border-border"
              allowFullScreen
            />
          ) : null}
        </div>

        {related.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Relacionados</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  subjectName={subject?.name}
                  isFavorite={favorites.includes(r.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
