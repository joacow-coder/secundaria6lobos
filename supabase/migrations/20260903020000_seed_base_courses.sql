-- Garantiza que el selector de ingreso de alumnos siempre tenga Turno Mañana
-- y Turno Tarde disponibles para 1° a 6° año, sin depender de que un
-- directivo/preceptor los haya cargado a mano desde Administración. Se usa
-- "A" como división por defecto; el personal puede agregar más divisiones
-- (B, C, ...) desde el panel sin afectar estas filas base.
insert into public.bib_courses (year, shift, division)
select y, s, 'A'
from generate_series(1, 6) as y
cross join unnest(array['manana', 'tarde']) as s
on conflict (year, shift, division) do nothing;
