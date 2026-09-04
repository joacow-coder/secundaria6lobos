import { getSecret } from "@/lib/secrets.server";
import { matches, type Audience, type TargetInput } from "@/lib/biblioteca/messages.functions";

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

type SubscriptionRow = { endpoint: string; p256dh: string; auth: string };

type Vapid = { subject: string; publicKey: string; privateKey: string };

async function loadVapid(): Promise<Vapid | null> {
  const subject = process.env["VAPID_SUBJECT"];
  const publicKey = process.env["VITE_VAPID_PUBLIC_KEY"];
  const privateKey = await getSecret("VAPID_PRIVATE_KEY");
  if (!subject || !publicKey || !privateKey) {
    console.warn("Push notifications: faltan variables VAPID, no se envía nada.");
    return null;
  }
  return { subject, publicKey, privateKey };
}

/** Entrega el push a una lista puntual de suscripciones y limpia las que ya expiraron. */
async function deliverToSubscriptions(
  rows: SubscriptionRow[],
  payload: { title: string; body: string; url: string },
  vapid: Vapid,
): Promise<void> {
  if (rows.length === 0) return;
  const { buildPushPayload } = await import("@block65/webcrypto-web-push");
  const db = await admin();
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
  const vapid = await loadVapid();
  if (!vapid) return;
  const db = await admin();
  const { data: subs } = await db.from("push_subscriptions").select("endpoint, p256dh, auth");
  await deliverToSubscriptions((subs ?? []) as SubscriptionRow[], payload, vapid);
}

/**
 * Dispara un push solo a las suscripciones de la Biblioteca Digital (con rol
 * asignado) cuyo perfil coincide con alguno de los destinatarios del
 * comunicado — mismo criterio de `matches()` que usa la bandeja
 * (bibInbox), así el push respeta rol/año/turno/curso/persona exactamente
 * igual que la web. Las suscripciones genéricas del sitio (sin rol, creadas
 * desde "/") quedan afuera: no reciben comunicados internos.
 */
export async function sendPushToTargets(
  payload: { title: string; body: string; url: string },
  targets: TargetInput[],
): Promise<void> {
  if (targets.length === 0) return;
  const vapid = await loadVapid();
  if (!vapid) return;

  const db = await admin();
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, role, name, year, shift, course_id, dni")
    .not("role", "is", null);

  type Row = SubscriptionRow & {
    role: string | null;
    name: string | null;
    year: number | null;
    shift: string | null;
    course_id: string | null;
    dni: string | null;
  };
  const rows = (subs ?? []) as Row[];

  const matching = rows.filter((s) => {
    if (!s.role) return false;
    const audience: Audience = {
      role: s.role as Audience["role"],
      name: s.name ?? "",
      year: s.year,
      shift: s.shift,
      courseId: s.course_id,
      dni: s.dni,
    };
    return targets.some((t) => matches(t, audience));
  });

  await deliverToSubscriptions(matching, payload, vapid);
}
