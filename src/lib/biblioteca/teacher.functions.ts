import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";
import { getSecret } from "@/lib/secrets.server";
import { assertStaff, timingSafeEqual } from "@/lib/biblioteca/staff-auth.server";
import { buildStoragePath } from "@/lib/biblioteca/storage-path.server";
import { assertSafeUploadContentType } from "@/lib/biblioteca/upload-safety.server";
import { validateUrl } from "@/lib/biblioteca/utils";

const staffRoleSchema = z.enum(["profesor", "preceptor", "directivo"]);

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200),
  description: z.string().max(5000),
  subject_code: z.string().max(20),
  year: z.number().int(),
  course_id: z.string().uuid().nullable().optional(),
  unit: z.string().max(200).nullable(),
  topic: z.string().max(200).nullable(),
  tags: z.array(z.string().max(50)).max(50),
  kind: z.string().max(30),
  file_path: z.string().max(500).nullable(),
  file_size: z.number().nullable(),
  mime_type: z.string().max(150).nullable(),
  external_url: z.string().max(2000).nullable(),
  provider: z.string().max(50).nullable(),
  featured: z.boolean(),
  teacher_name: z.string().max(120),
});
type ResourceInput = z.infer<typeof resourceSchema>;

const announcementSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200),
  body: z.string().max(5000),
  subject_code: z.string().max(20).nullable(),
  year: z.number().int().nullable(),
  importance: z.string().max(20),
  pinned: z.boolean(),
  teacher_name: z.string().max(120),
});
type AnnouncementInput = z.infer<typeof announcementSchema>;

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200),
  description: z.string().max(5000),
  event_type: z.string().max(30),
  subject_code: z.string().max(20).nullable(),
  year: z.number().int().nullable(),
  starts_at: z.string().max(40),
  ends_at: z.string().max(40).nullable(),
  teacher_name: z.string().max(120),
});
type EventInput = z.infer<typeof eventSchema>;

const codeSchema = z.object({ code: z.string().min(1).max(200) });
const codeIdSchema = z.object({ code: z.string().min(1).max(200), id: z.string().uuid() });

/**
 * Único punto de verificación del acceso docente de toda la plataforma.
 * Hoy valida el código maestro institucional. El día que se migre a usuarios
 * y contraseñas, solo hay que reemplazar el cuerpo de esta función por la
 * validación del token/sesión: el resto de las funciones no cambia.
 */
async function assertTeacher(code: unknown): Promise<void> {
  checkRateLimit(clientKey("teacher"));
  const expected = await getSecret("TEACHER_MASTER_CODE");
  if (!expected) throw new Error("El acceso docente no está configurado.");
  if (typeof code !== "string" || !timingSafeEqual(code.trim(), expected)) {
    throw new Error("El código institucional no es correcto.");
  }
}

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

export const bibVerifyCode = createServerFn({ method: "POST" })
  .inputValidator(codeSchema)
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    return { ok: true as const };
  });

export const bibSaveResource = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      role: staffRoleSchema,
      code: z.string().min(1).max(200),
      resource: resourceSchema,
    }),
  )
  .handler(async ({ data }) => {
    await assertStaff(data.role, data.code);
    const db = await admin();
    const { id, ...values } = data.resource;
    if (!values.title?.trim()) throw new Error("El título es obligatorio.");
    if (values.external_url) {
      // El cliente ya valida esto (solo https, sin caracteres raros) pero
      // eso es evitable llamando a la función directamente — sin este
      // check server-side, un enlace "javascript:" quedaría guardado y se
      // ejecutaría al tocarlo (XSS vía <a href>).
      const check = validateUrl(values.external_url);
      if (!check.ok) throw new Error(check.warning ?? "El enlace no es válido.");
    }
    const row = { ...values, title: values.title.trim() };
    const { error } = id
      ? await db
          .from("bib_resources")
          .update(row as never)
          .eq("id", id)
      : await db.from("bib_resources").insert(row as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteResource = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ role: staffRoleSchema, code: z.string().min(1).max(200), id: z.string().uuid() }),
  )
  .handler(async ({ data }) => {
    await assertStaff(data.role, data.code);
    const db = await admin();
    const { error } = await db
      .from("bib_resources")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveAnnouncement = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(1).max(200), announcement: announcementSchema }))
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const { id, ...values } = data.announcement;
    if (!values.title?.trim()) throw new Error("El título es obligatorio.");
    const { error } = id
      ? await db
          .from("bib_announcements")
          .update(values as never)
          .eq("id", id)
      : await db.from("bib_announcements").insert(values as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator(codeIdSchema)
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const { error } = await db.from("bib_announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveEvent = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(1).max(200), event: eventSchema }))
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const { id, ...values } = data.event;
    if (!values.title?.trim()) throw new Error("El título es obligatorio.");
    if (!values.starts_at) throw new Error("La fecha de inicio es obligatoria.");
    const { error } = id
      ? await db
          .from("bib_calendar_events")
          .update(values as never)
          .eq("id", id)
      : await db.from("bib_calendar_events").insert(values as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteEvent = createServerFn({ method: "POST" })
  .inputValidator(codeIdSchema)
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const { error } = await db.from("bib_calendar_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveSubject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(1).max(200),
      subject: z.object({
        code: z.string().max(20),
        name: z.string().max(120),
        year: z.number().int(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const subject = {
      code: data.subject.code.trim().toUpperCase(),
      name: data.subject.name.trim(),
      year: Number(data.subject.year),
    };
    if (!subject.code || !subject.name) throw new Error("Completá código y nombre.");
    const { error } = await db
      .from("bib_subjects")
      .upsert(subject as never, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteSubject = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(1).max(200), subjectCode: z.string().max(20) }))
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const { error } = await db.from("bib_subjects").delete().eq("code", data.subjectCode);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveBlockedWords = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ code: z.string().min(1).max(200), words: z.array(z.string().max(100)).max(1000) }),
  )
  .handler(async ({ data }) => {
    await assertTeacher(data.code);
    const db = await admin();
    const words = Array.from(
      new Set(data.words.map((w) => w.trim().toLowerCase()).filter(Boolean)),
    ).slice(0, 500);
    await db.from("bib_blocked_words").delete().neq("word", "\u0000");
    if (words.length > 0) {
      const { error } = await db
        .from("bib_blocked_words")
        .insert(words.map((word) => ({ word })) as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const bibUploadFile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      role: staffRoleSchema,
      code: z.string().min(1).max(200),
      category: z.enum(["recursos", "mensajes"]),
      subjectCode: z.string().max(20).nullable().optional(),
      shift: z.string().max(20).nullable().optional(),
      filename: z.string().min(1).max(255),
      contentType: z.string().max(100),
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await assertStaff(data.role, data.code);
    assertSafeUploadContentType(data.contentType);
    const path = buildStoragePath(data.category, data.filename, {
      shift: data.shift,
      segments: data.category === "recursos" && data.subjectCode ? [data.subjectCode] : [],
    });
    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.byteLength > 40 * 1024 * 1024) throw new Error("El archivo supera los 40 MB.");

    const db = await admin();
    const { error } = await db.storage
      .from("biblioteca")
      .upload(path, bytes, { contentType: data.contentType || "application/octet-stream" });
    if (error) throw new Error(error.message);
    return { path, size: bytes.byteLength };
  });

/** Contador público de vistas y descargas (no requiere acceso docente). */
export const bibTrackMetric = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), metric: z.enum(["views", "downloads"]) }))
  .handler(async ({ data }) => {
    checkRateLimit(clientKey("track-metric"));
    const db = await admin();
    const { data: row } = await db
      .from("bib_resources")
      .select("views, downloads")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { ok: false as const };
    const current = (row as { views: number; downloads: number })[data.metric] ?? 0;
    await db
      .from("bib_resources")
      .update({ [data.metric]: current + 1 } as never)
      .eq("id", data.id);
    return { ok: true as const };
  });
