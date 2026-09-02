import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";

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

