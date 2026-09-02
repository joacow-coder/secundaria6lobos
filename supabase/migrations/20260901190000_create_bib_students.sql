-- Registro único de alumnos de la Biblioteca Digital, identificados por DNI.
-- El DNI es la clave primaria: evita que un mismo alumno (incluso con nombres
-- repetidos) genere múltiples registros o cambie de año una vez que ingresó.
-- Contiene datos personales (DNI, nombre) por lo que NO se otorga acceso a
-- anon/authenticated: solo el service_role (usado por los server functions
-- con supabaseAdmin) puede leerla o escribirla.
CREATE TABLE public.bib_students (
  dni TEXT PRIMARY KEY CHECK (dni ~ '^[0-9]{7,8}$'),
  full_name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bib_students TO service_role;
ALTER TABLE public.bib_students ENABLE ROW LEVEL SECURITY;
