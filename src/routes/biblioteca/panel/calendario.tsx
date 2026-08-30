import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, WifiOff, X } from "lucide-react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { calendarQuery, subjectsQuery, type CalendarEvent } from "@/lib/biblioteca/data";
import { bibDeleteEvent, bibSaveEvent } from "@/lib/biblioteca/teacher.functions";
import { EVENT_TYPES, YEARS, formatDate, yearLabel } from "@/lib/biblioteca/utils";

export const Route = createFileRoute("/biblioteca/panel/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario — Panel docente Biblioteca Digital" },
      {
        name: "description",
        content: "Gestioná evaluaciones, actos y fechas importantes del calendario escolar.",
      },
      { property: "og:title", content: "Calendario — Panel docente Biblioteca Digital" },
      {
        property: "og:description",
        content: "Administración del calendario de eventos de la Biblioteca Digital de la E.E.S. N.º 6.",
      },
    ],
  }),
  component: PanelCalendario,
});

type FormState = {
  id?: string;
  title: string;
  description: string;
  event_type: string;
  subject_code: string;
  year: string;
  starts_at: string;
  ends_at: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  event_type: "fecha",
  subject_code: "todas",
  year: "todos",
  starts_at: "",
  ends_at: "",
};

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function PanelCalendario() {
  const navigate = useNavigate();
  const { teacher, ready } = useBibliotecaSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca/acceso" });
  }, [ready, teacher, navigate]);

  const eventsQ = useQuery(calendarQuery);
  const subjectsQ = useQuery(subjectsQuery);
  const subjects = subjectsQ.data ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setForm({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      event_type: ev.event_type,
      subject_code: ev.subject_code ?? "todas",
      year: ev.year ? String(ev.year) : "todos",
      starts_at: toDatetimeLocal(ev.starts_at),
      ends_at: toDatetimeLocal(ev.ends_at),
    });
    setOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teacher) throw new Error("Sesión inválida.");
      await bibSaveEvent({
        data: {
          code: teacher.credential,
          event: {
            id: form.id,
            title: form.title.trim(),
            description: form.description.trim(),
            event_type: form.event_type,
            subject_code: form.subject_code === "todas" ? null : form.subject_code,
            year: form.year === "todos" ? null : Number(form.year),
            starts_at: new Date(form.starts_at).toISOString(),
            ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
            teacher_name: teacher.full_name,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success(form.id ? "Evento actualizado." : "Evento publicado.");
      queryClient.invalidateQueries({ queryKey: ["biblioteca", "calendar_events"] });
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No pudimos guardar el evento."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!teacher) throw new Error("Sesión inválida.");
      await bibDeleteEvent({ data: { code: teacher.credential, id } });
    },
    onSuccess: () => {
      toast.success("Evento eliminado.");
      queryClient.invalidateQueries({ queryKey: ["biblioteca", "calendar_events"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No pudimos eliminar el evento."),
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
            <h1 className="font-display text-2xl font-bold text-foreground">Calendario</h1>
            <p className="text-sm text-muted-foreground">Evaluaciones, actos y fechas importantes.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> Nuevo evento
          </button>
        </div>

        <div className="space-y-3">
          {eventsQ.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : eventsQ.isError ? (
            <EmptyState
              icon={WifiOff}
              title="No pudimos cargar el calendario"
              description="Revisá tu conexión a internet y volvé a intentar."
              action={
                <button
                  type="button"
                  onClick={() => eventsQ.refetch()}
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Reintentar
                </button>
              }
            />
          ) : (eventsQ.data ?? []).length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Todavía no hay eventos cargados.
            </p>
          ) : (
            (eventsQ.data ?? []).map((ev) => (
              <div key={ev.id} className="card-lift rounded-xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {EVENT_TYPES[ev.event_type] ?? ev.event_type} · {ev.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(ev.starts_at)}
                      {ev.ends_at ? ` – ${formatDate(ev.ends_at)}` : ""} ·{" "}
                      {ev.year ? yearLabel(ev.year) : "Todos los años"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(ev)}
                      aria-label={`Editar ${ev.title}`}
                      className="inline-flex size-9 items-center justify-center rounded-md border border-input hover:bg-secondary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(ev)}
                      aria-label={`Eliminar ${ev.title}`}
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
            <DialogTitle>{form.id ? "Editar evento" : "Nuevo evento"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div>
              <label htmlFor="e-titulo" className="block text-sm font-medium text-foreground">Título</label>
              <input
                id="e-titulo"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="e-desc" className="block text-sm font-medium text-foreground">Descripción</label>
              <textarea
                id="e-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="e-tipo" className="block text-sm font-medium text-foreground">Tipo</label>
                <Select value={form.event_type} onValueChange={(v) => setForm((f) => ({ ...f, event_type: v }))}>
                  <SelectTrigger id="e-tipo" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="e-anio" className="block text-sm font-medium text-foreground">Año (opcional)</label>
                <Select value={form.year} onValueChange={(v) => setForm((f) => ({ ...f, year: v }))}>
                  <SelectTrigger id="e-anio" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los años</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{yearLabel(y)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="e-materia" className="block text-sm font-medium text-foreground">Materia (opcional)</label>
              <Select value={form.subject_code} onValueChange={(v) => setForm((f) => ({ ...f, subject_code: v }))}>
                <SelectTrigger id="e-materia" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las materias</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="e-inicio" className="block text-sm font-medium text-foreground">Fecha de inicio</label>
                <input
                  id="e-inicio"
                  type="datetime-local"
                  required
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="e-fin" className="block text-sm font-medium text-foreground">Fecha de fin (opcional)</label>
                <input
                  id="e-fin"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
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
            <DialogTitle>Eliminar evento</DialogTitle>
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
