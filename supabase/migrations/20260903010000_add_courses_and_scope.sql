-- Catálogo de cursos reales: año + turno + división. Turno y división no
-- existían en ningún lado del esquema hasta ahora; year seguía siendo el
-- único eje. bib_students.year y bib_resources.subject_code/year se
-- mantienen tal cual (compatibilidad) — course_id es aditivo.
CREATE TABLE public.bib_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL CHECK (year BETWEEN 1 AND 6),
  shift text NOT NULL CHECK (shift IN ('manana','tarde','vespertino')),
  division text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, shift, division)
);
GRANT SELECT ON public.bib_courses TO anon, authenticated;
GRANT ALL ON public.bib_courses TO service_role;
ALTER TABLE public.bib_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cursos visibles para todos" ON public.bib_courses FOR SELECT USING (true);

ALTER TABLE public.bib_students ADD COLUMN course_id uuid REFERENCES public.bib_courses(id);
ALTER TABLE public.bib_resources ADD COLUMN course_id uuid REFERENCES public.bib_courses(id);
ALTER TABLE public.bib_message_targets
  ADD COLUMN target_shift text,
  ADD COLUMN target_course_id uuid REFERENCES public.bib_courses(id);
