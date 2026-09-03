-- Adjuntos en comunicados (bib_messages). Reutiliza el targeting y la
-- seguridad ya existentes de bib_message_targets/bib_message_reads: esta
-- tabla sigue sin ningún GRANT a anon/authenticated, solo service_role la
-- toca — el filtrado por destinatario lo hace el server function bibInbox()
-- y la descarga la ruta protegida /api/private/comunicados/$id.
ALTER TABLE public.bib_messages
  ADD COLUMN attachment_path text,
  ADD COLUMN attachment_name text,
  ADD COLUMN attachment_size integer,
  ADD COLUMN attachment_mime_type text;
