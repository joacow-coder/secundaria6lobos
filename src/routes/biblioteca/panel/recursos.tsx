import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Star, Trash2, Upload, WifiOff, X } from "lucide-react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { coursesQuery, resourcesQuery, subjectsQuery, type Resource } from "@/lib/biblioteca/data";
import {
  bibDeleteResource,
  bibSaveResource,
  bibUploadFile,
} from "@/lib/biblioteca/teacher.functions";
import { fileToBase64 } from "@/lib/file-to-base64";
import { optimizeImageFile } from "@/lib/optimize-image";
import {
  ACCEPTED_EXTENSIONS,
  KIND_FILTERS,
  KIND_LABELS,
  SHIFT_LABELS,
  YEARS,
  detectProvider,
  formatDate,
  formatFileSize,
  isCurrentSchoolYear,
  kindFromFilename,
  yearLabel,
} from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/panel/recursos")({
  head: () => ({
    meta: [
      { title: "Materiales — Panel docente Biblioteca Digital" },
      {
        name: "description",
        content: "Alta, edición y baja de materiales de la Biblioteca Digital de la E.E.S. N.º 6.",
      },
      { property: "og:title", content: "Materiales — Panel docente Biblioteca Digital" },
      {
        property: "og:description",
        content: "Gestión de materiales educativos de la Biblioteca Digital institucional.",
      },
    ],
  }),
  component: PanelRecursos,
});

type FormState = {
  id?: string;
  title: string;
  description: string;
  subject_code: string;
  year: number;
  course_id: string | null;
  unit: string;
  topic: string;
  tags: string;
  kind: string;
  featured: boolean;
  sourceMode: "archivo" | "enlace";
  external_url: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
};

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  subject_code: "",
  year: 1,
  course_id: null,
  unit: "",
  topic: "",
  tags: "",
  kind: "documento",
  featured: false,
  sourceMode: "archivo",
  external_url: "",
  file_path: null,
  file_size: null,
  mime_type: null,
};

function PanelRecursos() {
  const navigate = useNavigate();
  const { teacher, ready } = useBibliotecaSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  const resourcesQ = useQuery(resourcesQuery);
  const subjectsQ = useQuery(subjectsQuery);
  const coursesQ = useQuery(coursesQuery);
  const courses = coursesQ.data ?? [];

  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState<string>("todos");
  const [filterSubject, setFilterSubject] = useState<string>("todas");
  const [filterKind, setFilterKind] = useState<string>("todos");
  const [showHistorical, setShowHistorical] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const subjects = subjectsQ.data ?? [];
  const resources = resourcesQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (!showHistorical && !isCurrentSchoolYear(r.created_at)) return false;
      if (filterYear !== "todos" && String(r.year) !== filterYear) return false;
      if (filterSubject !== "todas" && r.subject_code !== filterSubject) return false;
      if (filterKind !== "todos" && r.kind !== filterKind) return false;
      if (q && !`${r.title} ${r.description} ${r.topic ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, search, filterYear, filterSubject, filterKind, showHistorical]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, subject_code: subjects[0]?.code ?? "" });
    setPendingFile(null);
    setOpen(true);
  }

  function openEdit(resource: Resource) {
    setForm({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      subject_code: resource.subject_code,
      year: resource.year,
      course_id: resource.course_id,
      unit: resource.unit ?? "",
      topic: resource.topic ?? "",
      tags: resource.tags.join(", "),
      kind: resource.kind,
      featured: resource.featured,
      sourceMode: resource.external_url ? "enlace" : "archivo",
      external_url: resource.external_url ?? "",
      file_path: resource.file_path,
      file_size: resource.file_size,
      mime_type: resource.mime_type,
    });
    setPendingFile(null);
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teacher) throw new Error("Sesión inválida.");
      let filePath = form.file_path;
      let fileSize = form.file_size;
      let mimeType = form.mime_type;
      let externalUrl: string | null = null;
      let provider: string | null = null;
      let kind = form.kind;

      const selectedCourse = form.course_id ? courses.find((c) => c.id === form.course_id) : null;

      if (form.sourceMode === "archivo") {
        if (pendingFile) {
          setUploading(true);
          const optimized = await optimizeImageFile(pendingFile);
          const base64 = await fileToBase64(optimized);
          const result = await bibUploadFile({
            data: {
              role: teacher.role,
              code: teacher.credential,
              category: "recursos",
              subjectCode: form.subject_code || null,
              shift: selectedCourse?.shift ?? null,
              filename: optimized.name,
              contentType: optimized.type,
              base64,
            },
          });
          filePath = result.path;
          fileSize = result.size;
          mimeType = optimized.type || null;
          kind = kindFromFilename(optimized.name);
          setUploading(false);
        }
        if (!filePath) throw new Error("Subí un archivo o cambiá a modo enlace.");
      } else {
        if (!form.external_url.trim()) throw new Error("Ingresá el enlace externo.");
        externalUrl = form.external_url.trim();
        provider = detectProvider(externalUrl)?.id ?? null;
        filePath = null;
        fileSize = null;
        mimeType = null;
        kind = "enlace";
      }

      if (!form.subject_code) throw new Error("Elegí una materia.");

      await bibSaveResource({
        data: {
          role: teacher.role,
          code: teacher.credential,
          resource: {
            id: form.id,
            title: form.title.trim(),
            description: form.description.trim(),
            subject_code: form.subject_code,
            year: Number(form.year),
            course_id: form.course_id,
            unit: form.unit.trim() || null,
            topic: form.topic.trim() || null,
            tags: form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            kind,
            file_path: filePath,
            file_size: fileSize,
            mime_type: mimeType,
            external_url: externalUrl,
            provider,
            featured: form.featured,
            teacher_name: teacher.full_name,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success(form.id ? "Material actualizado." : "Material publicado.");
      queryClient.invalidateQueries({ queryKey: ["biblioteca", "resources"] });
      setOpen(false);
    },
    onError: (err) => {
      setUploading(false);
      toast.error(err instanceof Error ? err.message : "No pudimos guardar el material.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!teacher) throw new Error("Sesión inválida.");
      await bibDeleteResource({ data: { role: teacher.role, code: teacher.credential, id } });
    },
    onSuccess: () => {
      toast.success("Material eliminado.");
      queryClient.invalidateQueries({ queryKey: ["biblioteca", "resources"] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "No pudimos eliminar el material.");
    },
  });

  if (!ready || !teacher) {
    return (
      <AppShell area="profesor">
        <Skeleton className="h-8 w-56" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell area="profesor">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Materiales</h1>
            <p className="text-sm text-muted-foreground">Administrá los recursos publicados en la biblioteca.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" /> Nuevo material
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, tema…"
              aria-label="Buscar materiales"
              className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger aria-label="Filtrar por año"><SelectValue placeholder="Año" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los años</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{yearLabel(y)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger aria-label="Filtrar por materia"><SelectValue placeholder="Materia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las materias</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterKind} onValueChange={setFilterKind}>
            <SelectTrigger aria-label="Filtrar por tipo"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {KIND_FILTERS.map((k) => (
                <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showHistorical}
            onChange={(e) => setShowHistorical(e.target.checked)}
            className="size-4"
          />
          Ver años anteriores (histórico)
        </label>

        {resourcesQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : resourcesQ.isError ? (
          <EmptyState
            icon={WifiOff}
            title="No pudimos cargar los materiales"
            description="Revisá tu conexión a internet y volvé a intentar."
            action={
              <button
                type="button"
                onClick={() => resourcesQ.refetch()}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Reintentar
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No hay materiales que coincidan.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const subject = subjects.find((s) => s.code === r.subject_code);
              return (
                <li key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-medium text-foreground">{r.title}</p>
                        {r.featured && <Star className="size-3.5 fill-warning text-warning" />}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {KIND_LABELS[r.kind] ?? r.kind} · {subject?.name ?? r.subject_code} · {yearLabel(r.year)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(r.file_size)} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        aria-label={`Editar ${r.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border border-input hover:bg-secondary"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(r)}
                        aria-label={`Eliminar ${r.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border border-input text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar material" : "Nuevo material"}</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div>
              <label htmlFor="r-titulo" className="block text-sm font-medium text-foreground">Título</label>
              <input
                id="r-titulo"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="r-desc" className="block text-sm font-medium text-foreground">Descripción</label>
              <textarea
                id="r-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="r-materia" className="block text-sm font-medium text-foreground">Materia</label>
                <Select value={form.subject_code} onValueChange={(v) => setForm((f) => ({ ...f, subject_code: v }))}>
                  <SelectTrigger id="r-materia" className="mt-1"><SelectValue placeholder="Elegir materia" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="r-anio" className="block text-sm font-medium text-foreground">Año</label>
                <Select value={String(form.year)} onValueChange={(v) => setForm((f) => ({ ...f, year: Number(v) }))}>
                  <SelectTrigger id="r-anio" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{yearLabel(y)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {courses.length > 0 ? (
              <div>
                <label htmlFor="r-curso" className="block text-sm font-medium text-foreground">
                  Curso (opcional, más preciso que el año)
                </label>
                <Select
                  value={form.course_id ?? "__todas__"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, course_id: v === "__todas__" ? null : v }))
                  }
                >
                  <SelectTrigger id="r-curso" className="mt-1">
                    <SelectValue placeholder="Todas las divisiones de este año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__todas__">Todas las divisiones de este año</SelectItem>
                    {courses
                      .filter((c) => c.year === form.year)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {SHIFT_LABELS[c.shift] ?? c.shift} · {c.division}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="r-unidad" className="block text-sm font-medium text-foreground">Unidad</label>
                <input
                  id="r-unidad"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="r-tema" className="block text-sm font-medium text-foreground">Tema</label>
                <input
                  id="r-tema"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label htmlFor="r-tags" className="block text-sm font-medium text-foreground">Etiquetas (separadas por coma)</label>
              <input
                id="r-tags"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="ej.: repaso, guía, oral"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="r-destacado"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="size-4 rounded border-input"
              />
              <label htmlFor="r-destacado" className="text-sm font-medium text-foreground">Marcar como destacado</label>
            </div>

            <div>
              <p className="block text-sm font-medium text-foreground">Origen del material</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, sourceMode: "archivo" }))}
                  className={`rounded-lg border px-3 py-2 text-sm ${form.sourceMode === "archivo" ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground"}`}
                >
                  Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, sourceMode: "enlace" }))}
                  className={`rounded-lg border px-3 py-2 text-sm ${form.sourceMode === "enlace" ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground"}`}
                >
                  Enlace externo
                </button>
              </div>

              {form.sourceMode === "archivo" ? (
                <div className="mt-3">
                  <label
                    htmlFor="r-archivo"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 py-4 text-sm text-muted-foreground hover:bg-secondary/40"
                  >
                    <Upload className="size-4" />
                    {pendingFile ? pendingFile.name : form.file_path ? "Reemplazar archivo actual" : "Elegir archivo (máx. 40 MB)"}
                  </label>
                  <input
                    id="r-archivo"
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && file.size > MAX_UPLOAD_BYTES) {
                        toast.error(
                          `Ese archivo pesa ${formatFileSize(file.size)}, el máximo es 40 MB.`,
                        );
                        e.target.value = "";
                        return;
                      }
                      setPendingFile(file);
                    }}
                  />
                  {form.file_path && !pendingFile && (
                    <p className="mt-1 text-xs text-muted-foreground">Archivo actual: {formatFileSize(form.file_size)}</p>
                  )}
                </div>
              ) : (
                <div className="mt-3">
                  <label htmlFor="r-url" className="sr-only">Enlace externo</label>
                  <input
                    id="r-url"
                    type="url"
                    placeholder="https://…"
                    value={form.external_url}
                    onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {form.external_url && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Proveedor detectado: {detectProvider(form.external_url)?.label ?? "genérico"}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || uploading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {uploading ? "Subiendo…" : saveMutation.isPending ? "Guardando…" : "Guardar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar material</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Seguro que querés eliminar «{deleteTarget?.title}»? Esta acción lo ocultará de la biblioteca.
          </p>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2 text-sm hover:bg-secondary"
            >
              <X className="size-4" /> Cancelar
            </button>
            <button
              type="button"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              <Trash2 className="size-4" /> Eliminar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
