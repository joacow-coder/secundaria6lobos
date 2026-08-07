import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/biblioteca/AppShell";
import { bibAssistantChat } from "@/lib/biblioteca/assistant.functions";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

export const Route = createFileRoute("/biblioteca/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente — Biblioteca Digital E.E.S. N.º 6" },
      {
        name: "description",
        content:
          "Consultá al asistente de la Biblioteca Digital de la E.E.S. N.º 6 sobre materiales, materias, novedades y fechas del calendario escolar.",
      },
      { property: "og:title", content: "Asistente — Biblioteca Digital E.E.S. N.º 6" },
      {
        property: "og:description",
        content: "Resolvé dudas sobre los materiales y el calendario de la biblioteca escolar.",
      },
    ],
  }),
  component: AsistentePage,
});

const SUGGESTIONS = [
  "¿Qué materiales hay de Matemática de 3° año?",
  "¿Cuáles son las próximas fechas del calendario?",
  "¿Hay novedades importantes esta semana?",
];

type Msg = { role: "user" | "assistant"; content: string };

function AsistentePage() {
  const { teacher } = useBibliotecaSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await bibAssistantChat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "No pudimos responder ahora mismo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell area={teacher ? "profesor" : "alumno"}>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Asistente de la biblioteca</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preguntá por materiales, materias, novedades o fechas del calendario escolar.
        </p>
      </header>

      <div className="flex min-h-[55vh] flex-col rounded-xl border border-border bg-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4" /> Probá con una de estas preguntas:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {loading ? <p className="text-sm text-muted-foreground">Pensando…</p> : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <label className="sr-only" htmlFor="bib-chat">
            Tu consulta
          </label>
          <input
            id="bib-chat"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu consulta…"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            aria-label="Enviar"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}