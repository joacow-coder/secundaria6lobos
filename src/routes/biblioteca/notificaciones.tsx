import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, Bell, Check, Download, Inbox, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { EmptyState } from "@/components/biblioteca/EmptyState";
import { bibInbox, bibUpdateInboxState } from "@/lib/biblioteca/messages.functions";
import type { Audience, InboxMessage } from "@/lib/biblioteca/messages.functions";
import { useBibliotecaSession } from "@/lib/biblioteca/session";
import { formatDate, formatFileSize } from "@/lib/biblioteca/utils";

function attachmentUrl(message: InboxMessage, audience: Audience): string {
  const params = new URLSearchParams({
    role: audience.role,
    name: audience.name,
    descargar: "1",
  });
  if (audience.year != null) params.set("year", String(audience.year));
  return `/api/private/comunicados/${message.id}?${params.toString()}`;
}

export const Route = createFileRoute("/biblioteca/notificaciones")({
  head: () => ({
    meta: [
      { title: "Notificaciones — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content: "Bandeja de comunicados institucionales de la E.E.S. N.º 6 de Lobos.",
      },
      { property: "og:title", content: "Notificaciones — Biblioteca Digital E.E.S. N.º 6" },
      { property: "og:description", content: "Comunicados dirigidos a tu perfil y a tu año." },
    ],
  }),
  component: NotificacionesPage,
});

const ROLE_LABEL: Record<string, string> = {
  alumno: "Estudiantes",
  profesor: "Docentes",
  preceptor: "Preceptoría",
  directivo: "Dirección",
};

function targetsLabel(message: InboxMessage): string {
  return message.targets
    .map((t) => {
      if (t.target_type === "all") return "Toda la institución";
      if (t.target_type === "role") return ROLE_LABEL[t.target_role ?? ""] ?? "Comunidad";
      if (t.target_type === "year") return `${t.target_year}.º año`;
      return t.target_person ?? "Persona";
    })
    .join(" · ");
}

function NotificacionesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { audience, ready, role } = useBibliotecaSession();
  const [tab, setTab] = useState<"activas" | "archivadas">("activas");

  useEffect(() => {
    if (ready && !audience) navigate({ to: "/biblioteca" });
  }, [ready, audience, navigate]);

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["bib-inbox", audience],
    enabled: Boolean(audience),
    queryFn: () => bibInbox({ data: { audience: audience as Audience } }),
  });

  const update = useMutation({
    mutationFn: (input: { id: string; read?: boolean; archived?: boolean }) =>
      bibUpdateInboxState({ data: { audience: audience as Audience, ...input } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bib-inbox"] }),
  });

  const visible = messages.filter((m) => (tab === "activas" ? !m.archived : m.archived));

  return (
    <AppShell area={role === "alumno" || !role ? "alumno" : "profesor"}>
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Bell className="size-6 text-primary" /> Notificaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comunicados dirigidos a tu perfil{audience?.year ? ` y a ${audience.year}.º año` : ""}.
          </p>
        </header>

        <div className="flex gap-2">
          {(["activas", "archivadas"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-secondary" />
        ) : isError ? (
          <EmptyState
            icon={WifiOff}
            title="No pudimos cargar tus comunicados"
            description="Revisá tu conexión a internet y volvé a intentar."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Reintentar
              </button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No hay comunicados"
            description="Cuando la escuela envíe un comunicado para vos, aparece acá."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((m) => (
              <li
                key={m.id}
                className={`rounded-xl border bg-card p-4 shadow-soft ${
                  m.read_at ? "border-border" : "border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold">{m.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {m.sender_name} · {ROLE_LABEL[m.sender_role] ?? m.sender_role} ·{" "}
                      {formatDate(m.created_at)}
                    </p>
                  </div>
                  {!m.read_at ? (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      Nuevo
                    </span>
                  ) : null}
                </div>
                {m.body ? <p className="mt-2 text-sm whitespace-pre-line">{m.body}</p> : null}
                {m.attachment_name && audience ? (
                  <a
                    href={attachmentUrl(m, audience)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/70"
                  >
                    <Download className="size-4" /> {m.attachment_name}
                    {m.attachment_size ? ` (${formatFileSize(m.attachment_size)})` : ""}
                  </a>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">Para: {targetsLabel(m)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: m.id, read: !m.read_at })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/70"
                  >
                    <Check className="size-4" /> {m.read_at ? "Marcar como no leída" : "Marcar como leída"}
                  </button>
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: m.id, archived: !m.archived })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/70"
                  >
                    <Archive className="size-4" /> {m.archived ? "Restaurar" : "Archivar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}