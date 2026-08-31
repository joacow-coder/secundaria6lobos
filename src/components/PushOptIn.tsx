import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { pushSubscribe } from "@/lib/push.functions";

const SEEN_KEY = "ees6-push-optin-seen";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Segundo paso del flujo de bienvenida: pide permiso para notificaciones push.
 * No es invasivo (no abre el permiso nativo solo) y nunca lo pide de forma
 * automática — solo se activa cuando `active` pasa a true (tras el paso de
 * instalación) y espera a que el usuario toque "Activar".
 */
export function PushOptIn({ active = true }: { active?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (!active) return;
    const supported =
      typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
    if (!supported) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(SEEN_KEY) === "1") return;
    // Pequeño delay para que la transición desde el paso anterior sea fluida
    // en vez de un salto brusco de una tarjeta a otra.
    const timer = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(timer);
  }, [active]);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  };

  const activate = async () => {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }
      const publicKey = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;
      if (!publicKey) throw new Error("Notificaciones no configuradas.");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await pushSubscribe({
        data: subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } },
      });
      setStatus("done");
      dismiss();
    } catch (error) {
      console.error("No se pudo activar las notificaciones:", error);
      setStatus("error");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-4 animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
      <div className="mx-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-elegant">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-navy text-primary-foreground">
          <Bell className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-navy">Activar notificaciones</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Recibí al instante avisos de la escuela y noticias importantes, directo en tu celular.
          </p>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={activate}
              disabled={status === "loading"}
              className="shrink-0 rounded-full bg-brand-navy px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-brand-sky hover:text-brand-navy disabled:opacity-60"
            >
              {status === "loading" ? "Activando…" : "Activar"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
