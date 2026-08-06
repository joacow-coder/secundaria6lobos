import { Link } from "@tanstack/react-router";
import { Download, Eye, Heart, User } from "lucide-react";
import type { Resource } from "@/lib/biblioteca/data";
import { KIND_LABELS, formatFileSize } from "@/lib/biblioteca/utils";

export function ResourceCard({
  resource,
  subjectName,
  isFavorite,
  onToggleFavorite,
}: {
  resource: Resource;
  subjectName?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  return (
    <article className="card-lift flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-2 border-b border-border bg-secondary/50 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="w-fit rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {KIND_LABELS[resource.kind] ?? KIND_LABELS["otro"]}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {subjectName ?? resource.subject_code} · {resource.year}° Año
          </span>
        </div>
        {onToggleFavorite ? (
          <button
            type="button"
            aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
            onClick={() => onToggleFavorite(resource.id)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-secondary"
          >
            <Heart
              className={
                isFavorite ? "size-5 fill-accent text-accent" : "size-5 text-muted-foreground"
              }
            />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg leading-snug font-semibold">{resource.title}</h3>
        {resource.topic ? (
          <p className="text-sm text-muted-foreground">Tema: {resource.topic}</p>
        ) : null}
        <p className="line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>
        {resource.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {resource.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{resource.teacher_name}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" /> {resource.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <Download className="size-3.5" /> {resource.downloads}
          </span>
          {resource.file_size ? <span>{formatFileSize(resource.file_size)}</span> : null}
        </span>
      </div>

      <Link
        to="/biblioteca/recurso/$id"
        params={{ id: resource.id }}
        className="block border-t border-border bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Abrir material
      </Link>
    </article>
  );
}