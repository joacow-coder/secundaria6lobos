import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";

// Perfil de audiencia opcional: cuando la suscripción se crea (o se
// resincroniza) desde dentro de la Biblioteca Digital, se manda para poder
// filtrar después qué comunicados le corresponden a este dispositivo. Las
// suscripciones genéricas del sitio (creadas desde "/") no mandan audience
// y quedan sin rol — solo reciben noticias públicas, nunca comunicados
// internos (ver `sendPushToTargets` en push-broadcast.server.ts).
const audienceSchema = z
  .object({
    role: z.enum(["alumno", "profesor", "preceptor", "directivo"]),
    name: z.string().max(120),
    year: z.number().int().nullable(),
    shift: z.string().max(20).nullable(),
    courseId: z.string().uuid().nullable(),
    dni: z.string().max(20).nullable(),
  })
  .nullable()
  .optional();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  audience: audienceSchema,
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
        role: data.audience?.role ?? null,
        name: data.audience?.name ?? null,
        year: data.audience?.year ?? null,
        shift: data.audience?.shift ?? null,
        course_id: data.audience?.courseId ?? null,
        dni: data.audience?.dni ?? null,
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
