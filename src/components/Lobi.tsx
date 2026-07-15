import { useState } from "react";
import { chatbot, school } from "@/data/school";

export function Lobi() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = chatbot.options.find((o) => o.id === activeId) ?? null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="animate-fade-up mb-3 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
          <div className="flex items-center justify-between gap-3 bg-gradient-brand px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-white p-1 shadow-sm">
                <img src={school.logo} alt="EES N.º 6" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold leading-tight">{chatbot.title}</div>
                <div className="text-xs opacity-85">{chatbot.subtitle}</div>
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

          <div className="max-h-[55vh] overflow-y-auto bg-muted/40 p-4">
            {active ? (
              <div className="space-y-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="text-xs font-semibold text-brand-navy hover:underline"
                >
                  ← Volver a las preguntas
                </button>
                <div className="rounded-2xl bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-navy">
                    <span className="text-lg">{active.icon}</span>
                    <span>{active.question}</span>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                    {active.answer}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {chatbot.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setActiveId(o.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-brand-sky hover:bg-brand-sky/15"
                  >
                    <span className="text-lg">{o.icon}</span>
                    <span className="flex-1">{o.question}</span>
                    <span className="text-brand-sky">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 shadow-elegant ring-1 ring-border transition hover:scale-105"
        aria-label="Abrir preguntas frecuentes"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white p-1">
          <img src={school.logo} alt="EES N.º 6" className="h-full w-full object-contain" />
        </span>
        <span className="text-sm font-semibold text-brand-navy">
          {open ? "Cerrar" : "Preguntas frecuentes"}
        </span>
      </button>
    </div>
  );
}
