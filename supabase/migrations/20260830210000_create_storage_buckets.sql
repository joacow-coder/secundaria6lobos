-- El código de la biblioteca digital (src/lib/biblioteca/teacher.functions.ts y
-- src/routes/api/public/biblioteca/$.ts) sube y descarga archivos del bucket
-- "biblioteca" usando siempre el cliente con service_role (nunca el cliente
-- anon), así que no hace falta ninguna policy de storage.objects: service_role
-- ignora RLS por diseño. El bucket queda privado (public = false).
insert into storage.buckets (id, name, public)
values ('biblioteca', 'biblioteca', false)
on conflict (id) do nothing;

-- Lo mismo para el panel de administración del sitio (src/lib/site.functions.ts,
-- ahora convertido a server function con service_role, y
-- src/routes/api/public/media/$.ts, que sirve los archivos por proxy).
-- Bucket privado, sin policies de storage.objects necesarias.
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;
