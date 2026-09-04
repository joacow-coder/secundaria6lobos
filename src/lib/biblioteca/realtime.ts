import { supabase } from "@/integrations/supabase/client";
import { matches, type Audience, type TargetInput } from "@/lib/biblioteca/messages.functions";

// Estas constantes y el tipo del payload los usa también
// realtime-broadcast.server.ts (del lado servidor) — viven acá, en un
// módulo client-safe, porque un .server.ts sí puede importar de un módulo
// de cliente, pero no al revés (rompería el bundle del cliente).
export const BIB_MESSAGES_CHANNEL = "bib-messages";
export const BIB_MESSAGES_EVENT = "new-message";

export type BibMessageBroadcast = {
  id: string;
  title: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  targets: TargetInput[];
};

/**
 * Se suscribe al canal de Supabase Realtime (Broadcast) donde el servidor
 * avisa cada comunicado nuevo (ver `broadcastNewBibMessage` en
 * realtime-broadcast.server.ts) y llama a `onMatch` solo cuando alguno de
 * los destinatarios del mensaje coincide con la audiencia actual — mismo
 * criterio (`matches()`) que usa la bandeja del servidor, para no avisar de
 * comunicados que no le corresponden a este usuario.
 *
 * Devuelve una función para cancelar la suscripción (usar en el cleanup de
 * un `useEffect`).
 */
export function subscribeToBibMessages(
  audience: Audience | null,
  onMatch: (message: BibMessageBroadcast) => void,
): () => void {
  if (!audience) return () => {};

  const channel = supabase.channel(BIB_MESSAGES_CHANNEL);
  channel.on("broadcast", { event: BIB_MESSAGES_EVENT }, ({ payload }) => {
    const message = payload as BibMessageBroadcast;
    if (message?.targets?.some((t) => matches(t, audience))) onMatch(message);
  });
  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
