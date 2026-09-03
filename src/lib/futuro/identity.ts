/**
 * Tu Futuro no tiene su propio login de alumnos/docentes — es un sitio
 * público. Pero como vive en el mismo origen que la Biblioteca Digital,
 * puede leer el mismo localStorage: si la persona ya se identificó ahí
 * (alumno o personal), se reutiliza ese nombre acá en vez de pedirlo de
 * nuevo. Estas claves son las mismas que usa `src/lib/biblioteca/session.tsx`.
 */
const STUDENT_KEY = "bib.student";
const TEACHER_KEY = "bib.teacher";

export type BibliotecaIdentity = { name: string; role: string };

export function readBibliotecaIdentity(): BibliotecaIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEACHER_KEY);
    if (raw) {
      const teacher = JSON.parse(raw) as { full_name?: string; role?: string };
      if (teacher?.full_name?.trim()) {
        return { name: teacher.full_name.trim(), role: teacher.role ?? "profesor" };
      }
    }
  } catch {
    /* localStorage no disponible o dato corrupto: se ignora */
  }
  try {
    const raw = window.localStorage.getItem(STUDENT_KEY);
    if (raw) {
      const student = JSON.parse(raw) as { name?: string };
      if (student?.name?.trim()) {
        return { name: student.name.trim(), role: "alumno" };
      }
    }
  } catch {
    /* localStorage no disponible o dato corrupto: se ignora */
  }
  return null;
}
