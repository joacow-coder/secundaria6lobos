import { getSecret } from "@/lib/secrets.server";

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

/**
 * Dispara un push a todas las suscripciones guardadas. Se llama desde
 * adminSaveSection cuando se publica una noticia nueva. Compatible con el
 * runtime de Cloudflare Workers vía @block65/webcrypto-web-push (Web Crypto
 * puro).
 *
 * Vive en su propio módulo .server.ts (en vez de junto a los createServerFn
 * de push.functions.ts) porque push.functions.ts es importado por
 * PushOptIn.tsx, un componente de cliente: al no ser un createServerFn, esta
 * función no se puede recortar del bundle del cliente, y arrastraría este
 * import de secrets.server (bloqueado en cliente) rompiendo el build.
 */
export async function sendPushToAllSubscriptions(payload: {
  title: string;
  body: string;
  url: string;
}): Promise<void> {
  const subject = process.env["VAPID_SUBJECT"];
  const publicKey = process.env["VITE_VAPID_PUBLIC_KEY"];
  const privateKey = await getSecret("VAPID_PRIVATE_KEY");
  if (!subject || !publicKey || !privateKey) {
    console.warn("Push notifications: faltan variables VAPID, no se envía nada.");
    return;
  }

  const { buildPushPayload } = await import("@block65/webcrypto-web-push");
  const db = await admin();

  const { data: subs } = await db.from("push_subscriptions").select("endpoint, p256dh, auth");
  const rows = subs ?? [];
  if (rows.length === 0) return;

  const vapid = { subject, publicKey, privateKey };
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    rows.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        expirationTime: null,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      const message = { data: JSON.stringify(payload), options: { ttl: 60 * 60 } };
      const request = await buildPushPayload(message, subscription, vapid);
      const res = await fetch(subscription.endpoint, request as RequestInit);
      if (res.status === 404 || res.status === 410) staleEndpoints.push(s.endpoint);
    }),
  );

  if (staleEndpoints.length > 0) {
    await db.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }
}
