import { createServerFn } from "@tanstack/react-start";

type ResourceInput = {
  id?: string;
  title: string;
  description: string;
  subject_code: string;
  year: number;
  unit: string | null;
  topic: string | null;
  tags: string[];
  kind: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  provider: string | null;
  featured: boolean;
  teacher_name: string;
};

type AnnouncementInput = {
  id?: string;
  title: string;
  body: string;
  subject_code: string | null;
  year: number | null;
  importance: string;
  pinned: boolean;
  teacher_name: string;
};

type EventInput = {
  id?: string;
  title: string;
  description: string;
  event_type: string;
  subject_code: string | null;
  year: number | null;
  starts_at: string;
  ends_at: string | null;
  teacher_name: string;
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Único punto de verificación del acceso docente de toda la plataforma.
 * Hoy valida el código maestro institucional. El día que se migre a usuarios
 * y contraseñas, solo hay que reemplazar el cuerpo de esta función por la
 * validación del token/sesión: el resto de las funciones no cambia.
 */
function assertTeacher(code: unknown): void {
  const expected = process.env["TEACHER_MASTER_CODE"];
  if (!expected) throw new Error("El acceso docente no está configurado.");
  if (typeof code !== "string" || !timingSafeEqual(code.trim(), expected)) {
    throw new Error("El código institucional no es correcto.");
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const bibVerifyCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    return { ok: true as const };
  });

export const bibSaveResource = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; resource: ResourceInput }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { id, ...values } = data.resource;
    if (!values.title?.trim()) throw new Error("El título es obligatorio.");
    const row = { ...values, title: values.title.trim() };
    const { error } = id
      ? await db.from("bib_resources").update(row as never).eq("id", id)
      : await db.from("bib_resources").insert(row as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteResource = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; id: string }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { error } = await db
      .from("bib_resources")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; announcement: AnnouncementInput }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { id, ...values } = data.announcement;
    if (!values.title?.trim()) throw new Error("El título es obligatorio.");
    const { error } = id
      ? await db.from("bib_announcements").update(values as never).eq("id", id)
      : await db.from("bib_announcements").insert(values as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; id: string }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { error } = await db.from("bib_announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; event: EventInput }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { id, ...values } = data.event;
    if (!values.title?.trim()) throw new Error("El título es obligatorio.");
    if (!values.starts_at) throw new Error("La fecha de inicio es obligatoria.");
    const { error } = id
      ? await db.from("bib_calendar_events").update(values as never).eq("id", id)
      : await db.from("bib_calendar_events").insert(values as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibDeleteEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; id: string }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { error } = await db.from("bib_calendar_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveSubject = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; subject: { code: string; name: string; year: number } }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
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
  .inputValidator((d: { code: string; subjectCode: string }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const db = await admin();
    const { error } = await db.from("bib_subjects").delete().eq("code", data.subjectCode);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSaveBlockedWords = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; words: string[] }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
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
  .inputValidator((d: { code: string; filename: string; contentType: string; base64: string }) => d)
  .handler(async ({ data }) => {
    assertTeacher(data.code);
    const clean = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-70);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;
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
  .inputValidator((d: { id: string; metric: "views" | "downloads" }) => d)
  .handler(async ({ data }) => {
    if (data.metric !== "views" && data.metric !== "downloads") return { ok: false as const };
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