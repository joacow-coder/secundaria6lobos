import { getSecret } from "@/lib/secrets.server";
import {
  BIB_MESSAGES_CHANNEL,
  BIB_MESSAGES_EVENT,
  type BibMessageBroadcast,
} from "@/lib/biblioteca/realtime";

/**
 * Avisa por Supabase Realtime (Broadcast) que hay un comunicado nuevo, para
 * que la bandeja de los usuarios conectados se actualice al instante sin
 * recargar la página. Usa el endpoint HTTP de broadcast en vez de abrir un
 * WebSocket desde acá: el servidor corre en Cloudflare Workers, que no
 * sostiene una conexión persistente entre requests, así que un simple POST
 * es más simple y confiable que levantar un cliente Realtime del lado
 * servidor solo para mandar un mensaje y cerrarlo.
 *
 * No manda el cuerpo del comunicado ni adjuntos — solo lo necesario para que
 * el cliente decida si le corresponde (mismo `matches()` que usa la
 * bandeja) y arme un aviso corto. El contenido completo se sigue pidiendo
 * por `bibInbox`, que respeta la audiencia real del usuario.
 *
 * Best-effort: si falla (Realtime deshabilitado, red, etc.) no rompe el
 * envío del comunicado — la bandeja igual se actualiza al volver a entrar o
 * al refrescar.
 */
export async function broadcastNewBibMessage(payload: BibMessageBroadcast): Promise<void> {
  const url = process.env["SUPABASE_URL"];
  const serviceRoleKey = await getSecret("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return;

  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        messages: [{ topic: BIB_MESSAGES_CHANNEL, event: BIB_MESSAGES_EVENT, payload }],
      }),
    });
    if (!res.ok) {
      console.warn("No se pudo emitir el aviso en tiempo real:", res.status, await res.text());
    }
  } catch (error) {
    console.error("No se pudo emitir el aviso en tiempo real:", error);
  }
}
