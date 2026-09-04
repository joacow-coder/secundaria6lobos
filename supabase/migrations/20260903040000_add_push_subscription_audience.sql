-- Suma metadata de audiencia a las suscripciones push, para poder filtrar el
-- envío de comunicados de la Biblioteca por rol/año/turno/curso en vez de
-- mandarle todo a todo el mundo (las suscripciones genéricas del sitio,
-- creadas desde "/", quedan con estas columnas en null y solo reciben
-- noticias públicas, nunca comunicados internos).

ALTER TABLE public.push_subscriptions
  ADD COLUMN role text,
  ADD COLUMN name text,
  ADD COLUMN year integer,
  ADD COLUMN shift text,
  ADD COLUMN course_id uuid,
  ADD COLUMN dni text;

CREATE INDEX push_subscriptions_role_idx ON public.push_subscriptions(role);
