import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { PushOptIn } from "@/components/PushOptIn";
import { subscribeToBibMessages } from "@/lib/biblioteca/realtime";
import { syncPushAudience } from "@/lib/biblioteca/push-sync";
import { useBibliotecaSession } from "@/lib/biblioteca/session";

/**
 * Efectos en vivo de la Biblioteca Digital: se monta una sola vez en
 * `/biblioteca` (route.tsx), fuera de `AppShell` a propósito — a diferencia
 * de AppShell, que se remonta en cada navegación entre páginas, este
 * componente vive mientras dura la sesión, así la suscripción a Realtime no
 * se reconecta en cada click de menú.
 */
export function BibliotecaRealtime() {
  const { audience } = useBibliotecaSession();
  const queryClient = useQueryClient();

  // Bandeja en tiempo real: cuando el servidor avisa un comunicado nuevo que
  // coincide con esta audiencia, se refresca sola (sin recargar la página)
  // y se muestra un aviso corto.
  useEffect(() => {
    return subscribeToBibMessages(audience, (message) => {
      queryClient.invalidateQueries({ queryKey: ["bib-inbox"] });
      toast(message.title, { description: `${message.sender_name} · comunicado nuevo` });
    });
  }, [audience, queryClient]);

  // Si el permiso de notificaciones ya estaba concedido (por ejemplo, desde
  // el sitio general) pero la suscripción todavía no tiene este perfil
  // etiquetado, se resincroniza en silencio para que empiece a recibir los
  // comunicados que le corresponden.
  useEffect(() => {
    if (audience) void syncPushAudience(audience);
  }, [audience]);

  return <PushOptIn audience={audience} />;
}
