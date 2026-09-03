import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";
import { validateStudentName, toTitleCase } from "@/lib/biblioteca/utils";

const dniSchema = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, "El DNI debe tener 7 u 8 números, sin puntos.");

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

export type StudentIdentity = {
  dni: string;
  name: string;
  year: number;
  courseId: string | null;
  shift: string | null;
  since: string;
};

type StudentRow = {
  dni: string;
  full_name: string;
  year: number;
  course_id: string | null;
  created_at: string;
};

/**
 * Registra o recupera al alumno por DNI: es la clave única que evita
 * duplicados y alumnos homónimos. Si el DNI ya existe, se ignoran el nombre
 * y el año enviados y se devuelven los guardados originalmente — así el año
 * queda fijo para ese DNI en toda la Biblioteca Digital, sin importar qué
 * elija la persona en un ingreso posterior.
 */
export const bibVerifyStudent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      dni: z.string().min(1).max(20),
      name: z.string().min(1).max(120),
      year: z.number().int().min(1).max(6),
      courseId: z.string().uuid().nullable().optional(),
    }),
  )
  .handler(async ({ data }): Promise<StudentIdentity> => {
    checkRateLimit(clientKey("student"));

    const dniResult = dniSchema.safeParse(data.dni);
    if (!dniResult.success) throw new Error(dniResult.error.issues[0]?.message ?? "DNI inválido.");
    const dni = dniResult.data;

    const db = await admin();

    async function toIdentity(row: StudentRow): Promise<StudentIdentity> {
      let shift: string | null = null;
      if (row.course_id) {
        const { data: course } = await db
          .from("bib_courses")
          .select("shift")
          .eq("id", row.course_id)
          .maybeSingle();
        shift = (course as { shift: string } | null)?.shift ?? null;
      }
      return {
        dni: row.dni,
        name: row.full_name,
        year: row.year,
        courseId: row.course_id,
        shift,
        since: row.created_at,
      };
    }

    const { data: existing, error: lookupError } = await db
      .from("bib_students")
      .select("dni, full_name, year, course_id, created_at")
      .eq("dni", dni)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (existing) {
      const row = existing as StudentRow;
      await db
        .from("bib_students")
        .update({ last_seen_at: new Date().toISOString() } as never)
        .eq("dni", dni);
      return toIdentity(row);
    }

    const pretty = toTitleCase(data.name);
    const nameCheck = validateStudentName(pretty);
    if (!nameCheck.ok) throw new Error(nameCheck.message ?? "Revisá tu nombre.");

    // Si eligió un curso (turno+división), el año lectivo se toma de ahí —
    // nunca del valor suelto que mandó el cliente — para que no puedan
    // desincronizarse.
    let year = data.year;
    if (data.courseId) {
      const { data: course } = await db
        .from("bib_courses")
        .select("year")
        .eq("id", data.courseId)
        .maybeSingle();
      if (course) year = (course as { year: number }).year;
    }

    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await db
      .from("bib_students")
      .insert({
        dni,
        full_name: pretty,
        year,
        course_id: data.courseId ?? null,
        created_at: now,
        last_seen_at: now,
      } as never)
      .select("dni, full_name, year, course_id, created_at")
      .single();
    if (insertError) {
      // Carrera entre dos pestañas registrando el mismo DNI al mismo tiempo: recuperamos la fila ganadora.
      const { data: raced } = await db
        .from("bib_students")
        .select("dni, full_name, year, course_id, created_at")
        .eq("dni", dni)
        .maybeSingle();
      if (raced) return toIdentity(raced as StudentRow);
      throw new Error(insertError.message);
    }

    return toIdentity(inserted as StudentRow);
  });
