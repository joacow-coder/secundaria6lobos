import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Megaphone, Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import {
  bibSendMessage,
  bibSentMessages,
  type MessageAttachment,
} from "@/lib/biblioteca/messages.functions";
import type { StaffRole, TargetInput } from "@/lib/biblioteca/messages.functions";
import { bibUploadFile } from "@/lib/biblioteca/teacher.functions";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { coursesQuery } from "@/lib/biblioteca/data";
import { courseLabel, formatDate, formatFileSize, SHIFT_LABELS, SHIFTS } from "@/lib/biblioteca/utils";
import { fileToBase64 } from "@/lib/file-to-base64";
import { optimizeImageFile } from "@/lib/optimize-image";

const PDF_WARNING_BYTES = 15 * 1024 * 1024;

export const Route = createFileRoute("/biblioteca/panel/comunicados")({
  head: () => ({
    meta: [
      { title: "Enviar comunicados — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Panel institucional para enviar comunicados a cursos, perfiles o personas de la E.E.S. N.º 6.",
      },
      { property: "og:title", content: "Enviar comunicados — E.E.S. N.º 6" },
      { property: "og:description", content: "Comunicación institucional segmentada por destinatarios." },
    ],
  }),
  component: ComunicadosPage,
});

const YEARS = [1, 2, 3, 4, 5, 6];
const ROLES: { value: "alumno" | StaffRole; label: string }[] = [
  { value: "alumno", label: "Estudiantes" },
  { value: "profesor", label: "Docentes" },
  { value: "preceptor", label: "Preceptoría" },
  { value: "directivo", label: "Dirección" },
];

function ComunicadosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { teacher, ready } = useBibliotecaSession();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [toAll, setToAll] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [shifts, setShifts] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [person, setPerson] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: courses = [] } = useQuery(coursesQuery);

  function pickAttachment(file: File | undefined) {
    if (!file) return;
    if (file.type === "application/pdf" && file.size > PDF_WARNING_BYTES) {
      toast.warning(
        "Ese PDF es bastante pesado. Si son páginas escaneadas, considerá subirlas como imágenes sueltas para que se optimicen automáticamente.",
      );
    }
    setAttachment(file);
  }

  useEffect(() => {
    if (ready && !teacher) navigate({ to: "/biblioteca" });
  }, [ready, teacher, navigate]);

  const { data: sent = [] } = useQuery({
    queryKey: ["bib-sent", teacher?.role, teacher?.full_name],
    enabled: Boolean(teacher),
    queryFn: () =>
      bibSentMessages({
        data: {
          role: teacher!.role,
          code: teacher!.credential,
          senderName: teacher!.full_name,
        },
      }),
  });

  const send = useMutation({
    mutationFn: async (targets: TargetInput[]) => {
      let uploaded: MessageAttachment | null = null;
      if (attachment) {
        const optimized = await optimizeImageFile(attachment);
        const base64 = await fileToBase64(optimized);
        const result = await bibUploadFile({
          data: {
            role: teacher!.role,
            code: teacher!.credential,
            category: "mensajes",
            filename: optimized.name,
            contentType: optimized.type,
            base64,
          },
        });
        uploaded = {
          path: result.path,
          name: optimized.name,
          size: result.size,
          mimeType: optimized.type || "application/octet-stream",
        };
      }
      return bibSendMessage({
        data: {
          role: teacher!.role,
          code: teacher!.credential,
          title,
          body,
          senderName: teacher!.full_name,
          targets,
          attachment: uploaded,
        },
      });
    },
    onSuccess: () => {
      toast.success("Comunicado enviado.");
      setTitle("");
      setBody("");
      setToAll(false);
      setRoles([]);
      setYears([]);
      setShifts([]);
      setCourseIds([]);
      setPerson("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["bib-sent"] });
      queryClient.invalidateQueries({ queryKey: ["bib-inbox"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No pudimos enviar el comunicado."),
  });

  if (!ready || !teacher) {
    return (
      <AppShell area="profesor">
        <div className="h-40 animate-pulse rounded-xl bg-secondary" />
      </AppShell>
    );
  }

  function buildTargets(): TargetInput[] {
    const EMPTY = {
      target_role: null,
      target_year: null,
      target_shift: null,
      target_course_id: null,
      target_person: null,
    };
    if (toAll) {
      return [{ target_type: "all", ...EMPTY }];
    }
    const list: TargetInput[] = [];
    for (const year of years) {
      list.push({ target_type: "year", ...EMPTY, target_role: "alumno", target_year: year });
    }
    for (const s of shifts) {
      list.push({ target_type: "shift", ...EMPTY, target_shift: s });
    }
    for (const courseId of courseIds) {
      list.push({ target_type: "course", ...EMPTY, target_course_id: courseId });
    }
    for (const role of roles) {
      list.push({ target_type: "role", ...EMPTY, target_role: role });
    }
    if (person.trim()) {
      list.push({ target_type: "person", ...EMPTY, target_person: person.trim() });
    }
    return list;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const targets = buildTargets();
    if (!title.trim()) {
      toast.error("Escribí un título.");
      return;
    }
    if (targets.length === 0) {
      toast.error("Elegí al menos un destinatario.");
      return;
    }
    send.mutate(targets);
  }

  function toggle<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  return (
    <AppShell area="profesor">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Megaphone className="size-6 text-primary" /> Comunicados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí explícitamente a quién le llega cada mensaje. Nunca se envía a todos por defecto.
          </p>
        </header>

        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <label className="block text-sm font-medium" htmlFor="msg-title">
            Título
          </label>
          <input
            id="msg-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="msg-body">
            Mensaje
          </label>
          <textarea
            id="msg-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Destinatarios</legend>

            {teacher.role === "directivo" ? (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={toAll}
                  onChange={(e) => setToAll(e.target.checked)}
                  className="size-4"
                />
                Toda la institución
              </label>
            ) : null}

            <p className="mt-3 text-xs tracking-wide text-muted-foreground uppercase">Por año</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  disabled={toAll}
                  onClick={() => toggle(years, y, setYears)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    years.includes(y)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {y}.º año
                </button>
              ))}
            </div>

            {courses.length > 0 ? (
              <>
                <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
                  Por turno
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {SHIFTS.filter((s) => courses.some((c) => c.shift === s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={toAll}
                      onClick={() => toggle(shifts, s, setShifts)}
                      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        shifts.includes(s)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {SHIFT_LABELS[s] ?? s}
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
                  Por curso (salón puntual)
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {courses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={toAll}
                      onClick={() => toggle(courseIds, c.id, setCourseIds)}
                      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        courseIds.includes(c.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {courseLabel(c)}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">Por perfil</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  disabled={toAll}
                  onClick={() => toggle(roles, r.value, setRoles)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    roles.includes(r.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-xs tracking-wide text-muted-foreground uppercase" htmlFor="msg-person">
              A una persona (nombre y apellido)
            </label>
            <input
              id="msg-person"
              value={person}
              disabled={toAll}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Ej.: María López"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </fieldset>

          <div className="mt-5">
            <label className="block text-sm font-medium">Adjunto (opcional)</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => pickAttachment(e.target.files?.[0])}
              className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
            />
            {attachment ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="size-3.5" /> {attachment.name} ({formatFileSize(attachment.size)})
                <button
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-1 inline-flex items-center text-destructive hover:underline"
                >
                  <X className="size-3.5" /> Quitar
                </button>
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={send.isPending}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="size-4" /> {send.isPending ? "Enviando…" : "Enviar comunicado"}
          </button>
        </form>

        <section>
          <h2 className="font-display text-lg font-semibold">Historial de envíos</h2>
          {sent.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Megaphone}
                title="Todavía no enviaste comunicados"
                description="Los mensajes que envíes van a quedar registrados acá."
              />
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {sent.map((m) => (
                <li key={m.id} className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.sender_name} · {formatDate(m.created_at)}
                  </p>
                  {m.attachment_name ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Paperclip className="size-3.5" /> {m.attachment_name}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}