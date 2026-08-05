import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { PageHeader } from "@/components/futuro/Layout";
import { futuroSite } from "@/lib/futuro/site";
import type { ReactNode } from "react";

function Section({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={["mx-auto max-w-6xl px-4 py-14 sm:px-6", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}

function CompartirPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const origin = `${window.location.origin}/tu-futuro`;
    setUrl(origin);
    import("qrcode").then((QRCode) => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, origin, {
          width: 320,
          margin: 1,
          color: { dark: "#141f45", light: "#ffffff" },
        });
      }
    });
  }, []);

  function descargarQr() {
    const a = document.createElement("a");
    a.download = "qr-orientacion-ees6.png";
    a.href = canvasRef.current?.toDataURL("image/png") ?? "";
    a.click();
  }

  async function copiarEnlace() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <PageHeader
        eyebrow="Difusión"
        title="Compartí la plataforma con toda la escuela"
        description="Imprimí el código QR para la cartelera, las aulas o los cuadernos de comunicaciones. También podés copiar el enlace para enviarlo por WhatsApp."
      />
      <Section className="max-w-3xl">
        <div className="grid gap-8 rounded-2xl border border-border bg-card p-8 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="mx-auto rounded-xl border border-border bg-white p-4">
            <canvas ref={canvasRef} aria-label="Código QR de la plataforma" />
          </div>
          <div>
            <p className="eyebrow">Enlace directo</p>
            <p className="mt-2 break-all rounded-lg bg-muted px-4 py-3 text-sm">{url}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={descargarQr}
                className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Descargar QR
              </button>
              <button
                type="button"
                onClick={copiarEnlace}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
              >
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiado ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Esta plataforma es una herramienta permanente de {futuroSite.escuela}. Se actualiza cada
              año desde el panel de administración, sin necesidad de rehacer el sitio.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}

export const Route = createFileRoute("/tu-futuro/compartir")({
  head: () => ({
    meta: [
      { title: "Compartir la plataforma | Orientación EES N.º 6" },
      {
        name: "description",
        content:
          "Código QR y enlace para compartir la plataforma de orientación de la EES N.º 6 en carteleras, aulas y redes de la escuela.",
      },
      { property: "og:title", content: "Compartir la plataforma | EES N.º 6" },
      { property: "og:description", content: "Descargá el QR para pegarlo en la cartelera de la escuela." },
    ],
  }),
  component: CompartirPage,
});
