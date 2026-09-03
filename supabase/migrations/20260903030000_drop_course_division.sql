-- La escuela no tiene divisiones (A, B, ...): un curso es únicamente
-- año + turno. Se saca la columna "division" de bib_courses y se
-- reemplaza la restricción única por (year, shift). Como el seed previo
-- solo cargaba una fila "A" por año+turno, no hay filas duplicadas que
-- perder al sacar la columna.
ALTER TABLE public.bib_courses DROP CONSTRAINT bib_courses_year_shift_division_key;
ALTER TABLE public.bib_courses DROP COLUMN division;
ALTER TABLE public.bib_courses ADD CONSTRAINT bib_courses_year_shift_key UNIQUE (year, shift);
