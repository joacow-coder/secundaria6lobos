import { useState } from "react";
import { chatbot } from "@/data/school";

type Msg = { from: "bot" | "user"; text: string };

export function Lobi() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: chatbot.greeting },
  ]);

  const ask = (id: string) => {
    const opt = chatbot.options.find((o) => o.id === id);
    if (!opt) return;
    setMessages((m) => [
      ...m,
      { from: "user", text: opt.question },
      { from: "bot", text: opt.answer },
    ]);
  };

  const reset = () =>
    setMessages([{ from: "bot", text: chatbot.greeting }]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant animate-fade-up">
          <div className="flex items-center justify-between bg-gradient-brand px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-lg">
                🐺
              </div>
              <div>
                <div className="text-sm font-bold">Lobi</div>
                <div className="text-xs opacity-80">Asistente EES N.º 6</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="rounded-full px-2 py-1 text-xs hover:bg-white/15"
                title="Reiniciar"
              >
                ↻
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-xs hover:bg-white/15"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-[45vh] space-y-3 overflow-y-auto bg-muted/40 p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    m.from === "user"
                      ? "bg-brand-navy text-primary-foreground"
                      : "bg-card text-card-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border bg-card p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Elegí una pregunta:
            </div>
            <div className="flex flex-wrap gap-2">
              {chatbot.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => ask(o.id)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-brand-sky/40"
                >
                  {o.question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-primary-foreground shadow-elegant transition hover:scale-105"
        aria-label="Abrir chat con Lobi"
      >
        <span className="text-2xl">🐺</span>
        <span className="font-semibold">{open ? "Cerrar" : "Hablá con Lobi"}</span>
      </button>
    </div>
  );
}