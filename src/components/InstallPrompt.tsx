import { X } from "lucide-react";
import { useEffect, useState } from "react";
import logoAsset from "@/assets/logo.png";
import { useIsMobileOrTablet } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "ees6-install-dismissed";

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

/** Banner de instalación de la PWA — solo mobile/tablet, solo la primera vez. */
export function InstallPrompt() {
  const isMobileOrTablet = useIsMobileOrTablet();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1" || isStandalone());
    setIos(isIos());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  if (!isMobileOrTablet || dismissed) return null;
  if (!ios && !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-4">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-elegant">
        <img src={logoAsset} alt="" className="h-10 w-10 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-navy">Instalar en el celu</p>
          {ios ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tocá <span className="font-medium">Compartir</span> y después{" "}
              <span className="font-medium">"Agregar a inicio"</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Agregá el sitio a tu pantalla de inicio y usalo como una app.
            </p>
          )}
        </div>
        {!ios ? (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-full bg-brand-navy px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-brand-sky hover:text-brand-navy"
          >
            Instalar
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
