import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pin, Plus, Pencil, Trash2, WifiOff, X } from "lucide-react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { announcementsQuery, subjectsQuery, type Announcement } from "@/lib/biblioteca/data";
import { bibDeleteAnnouncement, bibSaveAnnouncement } from "@/lib/biblioteca/teacher.functions";
import { IMPORTANCE, YEARS, formatDate, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/panel/novedades")({
  head: () => ({
    meta: [
      { title: "Novedades — Panel docente Biblioteca Digital" },
      {
        name: "description",
        content: "Publicá y administrá las novedades institucionales de la Biblioteca Digital.",
      },
      { property: "og:title", content: "Novedades — Panel docente Biblioteca Digital" },
      {
        property: "og:description",
        content: "Gestión de novedades y avisos de la Biblioteca Digital de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: PanelNovedades,
});

type FormState = {
  id?: string;
  title: string;
  body: string;
  subject_code: string;
  year: string;
  importance: string;
  pinned: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
  subject_code: "todas",
  year: "todos",
  importance: "normal",
  pinned: false,
};

function PanelNovedades() {
  const navigate = useNavigate();
  const { teacher, ready } = useBibliotecaSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  const announcementsQ = useQuery(announcementsQuery);
  const subjectsQ = useQuery(subjectsQuery);
  const subjects = subjectsQ.data ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(a: Announcement) {
    setForm({
      id: a.id,
      title: a.title,
      body: a.body,
      subject_code: a.subject_code ?? "todas",
      year: a.year ? String(a.year) : "todos",
      importance: a.importance,
      pinned: a.pinned,
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teacher) throw new Error("Sesión inválida.");
      await bibSaveAnnouncement({
        data: {
          code: teacher.credential,
          announcement: {
            id: form.id,
            title: form.title.trim(),
            body: form.body.trim(),
            subject_code: form.subject_code === "todas" ? null : form.subject_code,
            year: form.year === "todos" ? null : Number(form.year),
            importance: form.importance,
            pinned: form.pinned,
            teacher_name: teacher.full_name,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success(form.id ? "Novedad actualizada." : "Novedad publicada.");
      queryClient.invalidateQueries({ queryKey: ["biblioteca", "announcements"] });
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No pudimos guardar la novedad."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!teacher) throw new Error("Sesión inválida.");
      await bibDeleteAnnouncement({ data: { code: teacher.credential, id } });
    },
    onSuccess: () => {
      toast.success("Novedad eliminada.");
      queryClient.invalidateQueries({ queryKey: ["biblioteca", "announcements"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No pudimos eliminar la novedad."),
  });

  if (!ready || !teacher) {
    return (
      <AppShell area="profesor">
        <Skeleton className="h-8 w-56" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell area="profesor">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Novedades</h1>
            <p className="text-sm text-muted-foreground">Avisos e informaciones para estudiantes.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Nueva novedad
          </button>
        </div>

        <div className="space-y-3">
          {announcementsQ.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : announcementsQ.isError ? (
            <EmptyState
              icon={WifiOff}
              title="No pudimos cargar las novedades"
              description="Revisá tu conexión a internet y volvé a intentar."
              action={
                <button
                  type="button"
                  onClick={() => announcementsQ.refetch()}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Reintentar
                </button>
              }
            />
          ) : (announcementsQ.data ?? []).length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Todavía no hay novedades publicadas.
            </p>
          ) : (
            (announcementsQ.data ?? []).map((a) => (
              <div key={a.id} className="card-lift rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.pinned && <Pin className="size-3.5 text-primary" />}
                      <h3 className="font-medium text-foreground">{a.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${IMPORTANCE[a.importance]?.className ?? ""}`}>
                        {IMPORTANCE[a.importance]?.label ?? a.importance}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.year ? yearLabel(a.year) : "Todos los años"} · {formatDate(a.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      aria-label={`Editar ${a.title}`}
                      className="inline-flex size-9 items-center justify-center rounded-md border border-input hover:bg-secondary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(a)}
                      aria-label={`Eliminar ${a.title}`}
                      className="inline-flex size-9 items-center justify-center rounded-md border border-input text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar novedad" : "Nueva novedad"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div>
              <label htmlFor="n-titulo" className="block text-sm font-medium text-foreground">Título</label>
              <input
                id="n-titulo"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="n-cuerpo" className="block text-sm font-medium text-foreground">Cuerpo</label>
              <textarea
                id="n-cuerpo"
                required
                rows={4}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="n-materia" className="block text-sm font-medium text-foreground">Materia (opcional)</label>
                <Select value={form.subject_code} onValueChange={(v) => setForm((f) => ({ ...f, subject_code: v }))}>
                  <SelectTrigger id="n-materia" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las materias</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="n-anio" className="block text-sm font-medium text-foreground">Año (opcional)</label>
                <Select value={form.year} onValueChange={(v) => setForm((f) => ({ ...f, year: v }))}>
                  <SelectTrigger id="n-anio" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los años</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{yearLabel(y)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="n-importancia" className="block text-sm font-medium text-foreground">Importancia</label>
                <Select value={form.importance} onValueChange={(v) => setForm((f) => ({ ...f, importance: v }))}>
                  <SelectTrigger id="n-importancia" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMPORTANCE).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <input
                    id="n-fijado"
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                    className="size-4 rounded border-input"
                  />
                  <label htmlFor="n-fijado" className="text-sm font-medium text-foreground">Fijar arriba</label>
                </div>
              </div>
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
                disabled={saveMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saveMutation.isPending ? "Guardando…" : "Guardar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar novedad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">¿Seguro que querés eliminar «{deleteTarget?.title}»?</p>
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
