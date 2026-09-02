-- Preguntas frecuentes institucionales (sitio y biblioteca), reemplaza al
-- asistente de IA externo: el chat busca por palabras clave en esta tabla y
-- responde con contenido curado por la escuela, sin depender de ninguna API
-- externa ni clave.
CREATE TABLE public.site_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'general', -- 'general' (sitio) | 'biblioteca'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX site_faq_category_idx ON public.site_faq (category);
GRANT SELECT ON public.site_faq TO anon, authenticated;
GRANT ALL ON public.site_faq TO service_role;
ALTER TABLE public.site_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQ visible para todos" ON public.site_faq FOR SELECT USING (true);

-- Puede ya existir (la crea la migración de bib_subjects); CREATE OR REPLACE
-- la deja definida acá también por si esa migración nunca se corrió.
CREATE OR REPLACE FUNCTION public.bib_touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER site_faq_touch BEFORE UPDATE ON public.site_faq
FOR EACH ROW EXECUTE FUNCTION public.bib_touch_updated_at();

INSERT INTO public.site_faq (category, question, answer, keywords) VALUES
(
  'general',
  '¿Dónde está ubicada la escuela?',
  'La escuela está ubicada en San Martín N.º 57, en la ciudad de Lobos, Provincia de Buenos Aires.',
  ARRAY['ubicacion', 'direccion', 'donde', 'queda', 'domicilio', 'localizacion']
),
(
  'general',
  'Horarios de ingreso y salida',
  E'Ingreso general: 13:14 hs para todos los cursos. Excepción: 6.º año ingresa los miércoles y viernes a las 12:10 hs.\n\nSalida general: 17:30 hs para todos los cursos. Excepciones: 6.º año sale los martes a las 18:30 hs. 5.º año tiene extensión horaria la mayoría de los días.',
  ARRAY['horario', 'horarios', 'ingreso', 'salida', 'entrada', 'hora']
),
(
  'general',
  '¿Cuándo fue inaugurada?',
  'La institución fue creada el 26 de mayo de 2006, fecha en la que se desvinculó formalmente de la E.E.S. N.º 1, de la cual funcionaba como Anexo. El 11 de noviembre de 2014 quedó conformada con su estructura institucional actual.',
  ARRAY['inauguracion', 'fundacion', 'creacion', 'historia', 'cuando', 'aniversario', 'antiguedad']
),
(
  'general',
  'Información de contacto',
  'Podés acercarte a San Martín N.º 57, Lobos. Teléfono: (02227) 42-0000. Correo: secundaria6lobos@abc.gob.ar. Instagram: @secundaria6lobos.',
  ARRAY['contacto', 'telefono', 'mail', 'correo', 'instagram', 'comunicarme']
),
(
  'general',
  'Inscripciones y trámites',
  'Para consultas sobre inscripciones, documentación o trámites académicos, comunicate directamente con la escuela en el horario de atención o seguinos en Instagram @secundaria6lobos para novedades.',
  ARRAY['inscripcion', 'inscribirme', 'documentacion', 'tramite', 'anotarme', 'vacante']
);
