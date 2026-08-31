import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logoAsset from "@/assets/logo.png";
import { useIsMobileOrTablet } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "ees6-install-dismissed";
// Tiempo de gracia para esperar el evento `beforeinstallprompt` antes de
// asumir que no hay nada para mostrar (y así poder seguir con el resto del
// flujo de bienvenida sin dejar al usuario esperando).
const SETTLE_MS = 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari en iOS expone esta propiedad no estándar cuando ya está instalada.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Banner de instalación de la PWA — solo mobile/tablet, solo la primera vez.
 * Se muestra como modal centrado con overlay oscuro sobre toda la página
 * para que la tarjeta de instalación quede como único foco de atención.
 *
 * Llama a `onSettled` una única vez cuando termina de decidir si tiene algo
 * para mostrar: al instante si no aplica (desktop, ya instalada, ya
 * descartada antes) o al cerrarse/instalar si sí se mostró. Esto permite
 * encadenar el siguiente paso del flujo de bienvenida (pedido de
 * notificaciones) de forma fluida.
 */
export function InstallPrompt({ onSettled }: { onSettled?: () => void }) {
  const isMobileOrTablet = useIsMobileOrTablet();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [ios, setIos] = useState(false);
  const settledRef = useRef(false);

  const notifySettled = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettled?.();
  };

  useEffect(() => {
    const mobileNow = window.matchMedia("(max-width: 1023px)").matches;
    const dismissedNow = localStorage.getItem(DISMISS_KEY) === "1" || isStandalone();
    const iosNow = isIos();
    setDismissed(dismissedNow);
    setIos(iosNow);

    if (!mobileNow || dismissedNow) {
      notifySettled();
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // En Android el evento puede tardar un instante en llegar; si no llega y
    // tampoco es iOS, no hay nada instalable para mostrar.
    const settleTimer = iosNow ? null : setTimeout(notifySettled, SETTLE_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (settleTimer) clearTimeout(settleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    notifySettled();
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
      setDismissed(true);
    }
    setDeferredPrompt(null);
    notifySettled();
  };

  if (!isMobileOrTablet || dismissed) return null;
  if (!ios && !deferredPrompt) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Instalar la aplicación"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 fade-in-0 duration-300">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-sky/20 ring-1 ring-brand-sky/30">
            <img src={logoAsset} alt="" className="h-10 w-10 object-contain" />
          </div>
          <p className="mt-4 text-lg font-extrabold text-brand-navy">Instalar app en el celu</p>

          {ios ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tocá el botón <span className="font-semibold text-foreground">Compartir</span> de
              Safari y después elegí{" "}
              <span className="font-semibold text-foreground">"Agregar a inicio"</span>.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Agregá el sitio a tu pantalla de inicio para acceder más rápido, sin el navegador y
              con acceso a notificaciones.
            </p>
          )}

          <div className="mt-6 flex w-full flex-col gap-2">
            {!ios ? (
              <button
                type="button"
                onClick={install}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-navy px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-brand-sky hover:text-brand-navy"
              >
                <Download className="size-4" />
                Instalar ahora
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="w-full rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
