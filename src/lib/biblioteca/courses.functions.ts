import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertStaff } from "@/lib/biblioteca/staff-auth.server";

const staffRoleSchema = z.enum(["profesor", "preceptor", "directivo"]);
const shiftSchema = z.enum(["manana", "tarde", "vespertino"]);

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

export const bibSaveCourse = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      role: staffRoleSchema,
      code: z.string().min(1).max(200),
      course: z.object({
        year: z.number().int().min(1).max(6),
        shift: shiftSchema,
      }),
    }),
  )
  .handler(async ({ data }) => {
    await assertStaff(data.role, data.code);
    const db = await admin();
    const course = { year: data.course.year, shift: data.course.shift };
    const { error } = await db
      .from("bib_courses")
      .upsert(course as never, { onConflict: "year,shift" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteCourse = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ role: staffRoleSchema, code: z.string().min(1).max(200), id: z.string().uuid() }),
  )
  .handler(async ({ data }) => {
    await assertStaff(data.role, data.code);
    const db = await admin();
    const { error } = await db.from("bib_courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
