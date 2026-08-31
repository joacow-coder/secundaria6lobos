-- Suscripciones de notificaciones push (Web Push API).
-- Sin policies de lectura/escritura pública: todo el acceso pasa por
-- supabaseAdmin en src/lib/push.functions.ts (mismo patrón que bib_message_reads).

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_created_idx ON public.push_subscriptions(created_at);

GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Sin policies: acceso solo vía supabaseAdmin (rol de servicio) en server functions.
