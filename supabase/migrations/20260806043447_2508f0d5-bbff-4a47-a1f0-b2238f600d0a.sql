CREATE TABLE public.bib_subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bib_subjects TO anon, authenticated;
GRANT ALL ON public.bib_subjects TO service_role;
ALTER TABLE public.bib_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materias visibles para todos" ON public.bib_subjects FOR SELECT USING (true);

CREATE TABLE public.bib_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  teach_years INTEGER[] NOT NULL DEFAULT '{}',
  subject_codes TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bib_teachers TO anon, authenticated;
GRANT ALL ON public.bib_teachers TO service_role;
ALTER TABLE public.bib_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docentes visibles para todos" ON public.bib_teachers FOR SELECT USING (true);

CREATE TABLE public.bib_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  unit TEXT,
  topic TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  kind TEXT NOT NULL DEFAULT 'otro',
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  external_url TEXT,
  provider TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  teacher_id UUID,
  teacher_name TEXT NOT NULL DEFAULT 'Equipo docente',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bib_resources_subject_idx ON public.bib_resources (subject_code);
CREATE INDEX bib_resources_year_idx ON public.bib_resources (year);
GRANT SELECT ON public.bib_resources TO anon, authenticated;
GRANT ALL ON public.bib_resources TO service_role;
ALTER TABLE public.bib_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recursos publicados visibles para todos" ON public.bib_resources FOR SELECT USING (deleted_at IS NULL);

CREATE TABLE public.bib_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  subject_code TEXT,
  year INTEGER,
  importance TEXT NOT NULL DEFAULT 'normal',
  pinned BOOLEAN NOT NULL DEFAULT false,
  teacher_id UUID,
  teacher_name TEXT NOT NULL DEFAULT 'Equipo docente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bib_announcements TO anon, authenticated;
GRANT ALL ON public.bib_announcements TO service_role;
ALTER TABLE public.bib_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Novedades visibles para todos" ON public.bib_announcements FOR SELECT USING (true);

CREATE TABLE public.bib_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'fecha',
  subject_code TEXT,
  year INTEGER,
  starts_at DATE NOT NULL,
  ends_at DATE,
  teacher_id UUID,
  teacher_name TEXT NOT NULL DEFAULT 'Equipo docente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bib_calendar_events TO anon, authenticated;
GRANT ALL ON public.bib_calendar_events TO service_role;
ALTER TABLE public.bib_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calendario visible para todos" ON public.bib_calendar_events FOR SELECT USING (true);

CREATE TABLE public.bib_blocked_words (
  word TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bib_blocked_words TO anon, authenticated;
GRANT ALL ON public.bib_blocked_words TO service_role;
ALTER TABLE public.bib_blocked_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Palabras bloqueadas visibles para todos" ON public.bib_blocked_words FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.bib_touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER bib_subjects_touch BEFORE UPDATE ON public.bib_subjects FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();
CREATE TRIGGER bib_teachers_touch BEFORE UPDATE ON public.bib_teachers FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();
CREATE TRIGGER bib_resources_touch BEFORE UPDATE ON public.bib_resources FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();
CREATE TRIGGER bib_announcements_touch BEFORE UPDATE ON public.bib_announcements FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();
CREATE TRIGGER bib_calendar_events_touch BEFORE UPDATE ON public.bib_calendar_events FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();

INSERT INTO public.bib_subjects (code, name, year) VALUES
('CSN101','Ciencias Naturales',1),('SOC101','Ciencias Sociales',1),('TEC101','Construcción de Ciudadanía',1),('ART101','Educación Artística',1),('EFI101','Educación Física',1),('ETC101','Educación Tecnológica',1),('ING101','Inglés',1),('MAT101','Matemática',1),('LEN101','Prácticas del Lenguaje',1),
('BIO201','Biología',2),('TEC201','Construcción de Ciudadanía',2),('ART201','Educación Artística',2),('EFI201','Educación Física',2),('GEO201','Geografía',2),('HIS201','Historia',2),('ING201','Inglés',2),('MAT201','Matemática',2),('LEN201','Prácticas del Lenguaje',2),
('BIO301','Biología',3),('ART301','Educación Artística',3),('EFI301','Educación Física',3),('FIS301','Física',3),('GEO301','Geografía',3),('HIS301','Historia',3),('ING301','Inglés',3),('MAT301','Matemática',3),('LEN301','Prácticas del Lenguaje',3),('QUI301','Química',3),
('BIO401','Biología',4),('EFI401','Educación Física',4),('FIL401','Filosofía',4),('FIS401','Física',4),('GEO401','Geografía',4),('HIS401','Historia',4),('ING401','Inglés',4),('LIT401','Literatura',4),('MAT401','Matemática',4),('NTI401','Nuevas Tecnologías de la Información',4),('QUI401','Química',4),
('BIO501','Biología',5),('EFI501','Educación Física',5),('FIL501','Filosofía',5),('FIS501','Física',5),('GEO501','Geografía',5),('HIS501','Historia',5),('ING501','Inglés',5),('LIT501','Literatura',5),('MAT501','Matemática',5),('POL501','Política y Ciudadanía',5),('QUI501','Química',5),('TRA501','Trabajo y Ciudadanía',5),
('BIO601','Biología',6),('ECO601','Economía',6),('EFI601','Educación Física',6),('FIL601','Filosofía',6),('FIS601','Física',6),('GEO601','Geografía',6),('HIS601','Historia',6),('ING601','Inglés',6),('LIT601','Literatura',6),('MAT601','Matemática',6),('PRO601','Proyecto de Investigación',6),('QUI601','Química',6);

INSERT INTO public.bib_blocked_words (word) VALUES
('admin'),('administrador'),('anonimo'),('anonima'),('test'),('prueba'),('asdf'),('qwerty'),('xdxd'),('batman'),('superman'),('messi dios'),('goku'),('spiderman'),('pepe pepe'),('boludo'),('pelotudo'),('forro'),('conchudo'),('puto'),('puta'),('mierda'),('concha'),('careculo'),('trolo'),('gato'),('nazi'),('hitler');