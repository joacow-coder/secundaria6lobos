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

export type StudentIdentity = { dni: string; name: string; year: number; since: string };

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
    }),
  )
  .handler(async ({ data }): Promise<StudentIdentity> => {
    checkRateLimit(clientKey("student"));

    const dniResult = dniSchema.safeParse(data.dni);
    if (!dniResult.success) throw new Error(dniResult.error.issues[0]?.message ?? "DNI inválido.");
    const dni = dniResult.data;

    const db = await admin();

    const { data: existing, error: lookupError } = await db
      .from("bib_students")
      .select("dni, full_name, year, created_at")
      .eq("dni", dni)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (existing) {
      const row = existing as { dni: string; full_name: string; year: number; created_at: string };
      await db
        .from("bib_students")
        .update({ last_seen_at: new Date().toISOString() } as never)
        .eq("dni", dni);
      return { dni: row.dni, name: row.full_name, year: row.year, since: row.created_at };
    }

    const pretty = toTitleCase(data.name);
    const nameCheck = validateStudentName(pretty);
    if (!nameCheck.ok) throw new Error(nameCheck.message ?? "Revisá tu nombre.");

    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await db
      .from("bib_students")
      .insert({
        dni,
        full_name: pretty,
        year: data.year,
        created_at: now,
        last_seen_at: now,
      } as never)
      .select("dni, full_name, year, created_at")
      .single();
    if (insertError) {
      // Carrera entre dos pestañas registrando el mismo DNI al mismo tiempo: recuperamos la fila ganadora.
      const { data: raced } = await db
        .from("bib_students")
        .select("dni, full_name, year, created_at")
        .eq("dni", dni)
        .maybeSingle();
      if (raced) {
        const row = raced as { dni: string; full_name: string; year: number; created_at: string };
        return { dni: row.dni, name: row.full_name, year: row.year, since: row.created_at };
      }
      throw new Error(insertError.message);
    }

    const row = inserted as { dni: string; full_name: string; year: number; created_at: string };
    return { dni: row.dni, name: row.full_name, year: row.year, since: row.created_at };
  });
