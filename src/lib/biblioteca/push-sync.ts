import { pushSubscribe } from "@/lib/push.functions";
import type { Audience } from "@/lib/biblioteca/messages.functions";

/**
 * Si el navegador ya tiene el permiso de notificaciones concedido (por
 * ejemplo, porque la persona lo activó antes desde el sitio general) pero
 * todavía no identificamos su perfil de Biblioteca, la suscripción guardada
 * quedaría sin rol/año/turno y nunca recibiría comunicados internos — solo
 * el `PushOptIn` (que pide el permiso por primera vez) manda el audience.
 *
 * Esto corrige ese caso: sin mostrar ningún banner, reetiqueta la
 * suscripción ya existente con el perfil actual. No pide permiso ni crea
 * una suscripción nueva si no había una.
 */
export async function syncPushAudience(audience: Audience): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const json = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    await pushSubscribe({ data: { ...json, audience } });
  } catch (error) {
    console.error("No se pudo sincronizar el perfil de notificaciones:", error);
  }
}
