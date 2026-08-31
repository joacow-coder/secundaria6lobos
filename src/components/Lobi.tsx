import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chatbot, school } from "@/data/school";
import { siteAssistantChat } from "@/lib/site.functions";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING = "¡Hola! 👋 Soy Lobi, el asistente de la escuela. ¿Qué querés saber hoy?";

/**
 * Botón flotante con únicamente el logo de la escuela — al tocarlo abre el
 * chat de Lobi, el asistente de IA del sitio. Los accesos rápidos son las
 * mismas preguntas frecuentes de antes (respuesta instantánea, sin IA); todo
 * lo demás lo responde el modelo con contexto de las secciones, noticias y
 * datos de la escuela.
 */
export function Lobi() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const askQuickOption = (question: string, answer: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]);
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await siteAssistantChat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            err instanceof Error ? err.message : "No pude responder ahora mismo, probá de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="animate-fade-up mb-3 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
          <div className="flex items-center justify-between gap-3 bg-gradient-brand px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white p-1 shadow-sm">
                <img src={school.logo} alt="EES N.º 6" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">Lobi</div>
                <div className="text-xs opacity-85">Asistente de la escuela</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-sm hover:bg-white/15"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
            <div className="flex justify-start">
              <p className="max-w-[85%] rounded-2xl bg-card px-4 py-2.5 text-sm text-foreground shadow-sm">
                {GREETING}
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="size-3.5" /> Preguntas rápidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {chatbot.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => askQuickOption(o.question, o.answer)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:-translate-y-0.5 hover:border-brand-sky hover:bg-brand-sky/15"
                    >
                      <span>{o.icon}</span>
                      {o.question}
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
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-brand-navy text-primary-foreground"
                      : "bg-card text-foreground shadow-sm"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start">
                <p className="rounded-2xl bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
                  Pensando…
                </p>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <label className="sr-only" htmlFor="lobi-chat-input">
              Escribile a Lobi
            </label>
            <input
              id="lobi-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta…"
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              aria-label="Enviar"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-navy text-primary-foreground transition hover:bg-brand-sky hover:text-brand-navy disabled:opacity-60"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-14 w-14 place-items-center rounded-full bg-white p-1.5 shadow-elegant ring-1 ring-border transition hover:scale-105"
        aria-label={open ? "Cerrar asistente" : "Abrir asistente de la escuela"}
      >
        <img src={school.logo} alt="EES N.º 6" className="h-full w-full object-contain" />
      </button>
    </div>
  );
}
