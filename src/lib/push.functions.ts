import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";
import { getSecret } from "@/lib/secrets.server";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

export const pushSubscribe = createServerFn({ method: "POST" })
  .inputValidator(subscribeSchema)
  .handler(async ({ data }) => {
    checkRateLimit(clientKey("push-subscribe"));
    const db = await admin();
    const { error } = await db.from("push_subscriptions").upsert(
      {
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const pushUnsubscribe = createServerFn({ method: "POST" })
  .inputValidator(z.object({ endpoint: z.string().url() }))
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    return { ok: true as const };
  });

/**
 * Helper server-only (no expuesto como server function): dispara un push a
 * todas las suscripciones guardadas. Se llama desde adminSaveSection cuando
 * se publica una noticia nueva. Compatible con el runtime de Cloudflare
 * Workers vía @block65/webcrypto-web-push (Web Crypto puro).
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
