import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertStaff, type StaffRole } from "@/lib/biblioteca/staff-auth.server";

export type { StaffRole };
export type Audience = {
  role: "alumno" | StaffRole;
  name: string;
  year: number | null;
  shift: string | null;
  courseId: string | null;
};
export type TargetInput = {
  target_type: "all" | "role" | "year" | "shift" | "course" | "person";
  target_role: string | null;
  target_year: number | null;
  target_shift: string | null;
  target_course_id: string | null;
  target_person: string | null;
};

const staffRoleSchema = z.enum(["profesor", "preceptor", "directivo"]);
const audienceSchema = z.object({
  role: z.enum(["alumno", "profesor", "preceptor", "directivo"]),
  name: z.string().min(1).max(120),
  year: z.number().int().nullable(),
  shift: z.string().max(20).nullable(),
  courseId: z.string().uuid().nullable(),
});
const targetSchema = z.object({
  target_type: z.enum(["all", "role", "year", "shift", "course", "person"]),
  target_role: z.string().max(20).nullable(),
  target_year: z.number().int().nullable(),
  target_shift: z.string().max(20).nullable(),
  target_course_id: z.string().uuid().nullable(),
  target_person: z.string().max(120).nullable(),
});

export type MessageAttachment = {
  path: string;
  name: string;
  size: number;
  mimeType: string;
};
const attachmentSchema = z
  .object({
    path: z.string().min(1).max(500),
    name: z.string().min(1).max(255),
    size: z.number().int().nonnegative(),
    mimeType: z.string().max(150),
  })
  .nullable()
  .optional();

export type InboxMessage = {
  id: string;
  title: string;
  body: string;
  sender_role: string;
  sender_name: string;
  created_at: string;
  targets: TargetInput[];
  read_at: string | null;
  archived: boolean;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime_type: string | null;
};

type MessageRow = {
  id: string;
  title: string;
  body: string;
  sender_role: string;
  sender_name: string;
  created_at: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime_type: string | null;
};
const MESSAGE_COLUMNS =
  "id, title, body, sender_role, sender_name, created_at, attachment_path, attachment_name, attachment_size, attachment_mime_type";

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

export function readerKeyOf(audience: Audience): string {
  const name = audience.name.trim().toLowerCase();
  return audience.role === "alumno"
    ? `alumno:${audience.year ?? 0}:${name}`
    : `${audience.role}:${name}`;
}

export function matches(target: TargetInput, audience: Audience): boolean {
  const name = audience.name.trim().toLowerCase();
  switch (target.target_type) {
    case "all":
      return true;
    case "role":
      return target.target_role === audience.role;
    case "year":
      return (
        audience.year != null &&
        target.target_year === audience.year &&
        (!target.target_role || target.target_role === audience.role)
      );
    case "shift":
      return audience.shift != null && target.target_shift === audience.shift;
    case "course":
      return audience.courseId != null && target.target_course_id === audience.courseId;
    case "person":
      return (target.target_person ?? "").trim().toLowerCase() === name;
    default:
      return false;
  }
}

export const bibVerifyStaffCode = createServerFn({ method: "POST" })
  .inputValidator(z.object({ role: staffRoleSchema, code: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    await assertStaff(data.role, data.code);
    return { ok: true as const };
  });

export const bibSendMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      role: staffRoleSchema,
      code: z.string().min(1).max(200),
      title: z.string().max(200),
      body: z.string().max(5000),
      senderName: z.string().max(120),
      targets: z.array(targetSchema).max(60),
      attachment: attachmentSchema,
    }),
  )
  .handler(async ({ data }) => {
    const role = await assertStaff(data.role, data.code);
    const title = data.title.trim();
    if (!title) throw new Error("El título es obligatorio.");
    if (!data.targets.length) throw new Error("Elegí al menos un destinatario.");
    if (role !== "directivo" && data.targets.some((t) => t.target_type === "all")) {
      throw new Error("Solo la dirección puede enviar a toda la institución.");
    }

    const db = await admin();
    const { data: inserted, error } = await db
      .from("bib_messages")
      .insert({
        sender_role: role,
        sender_name: data.senderName.trim() || "Equipo institucional",
        title,
        body: data.body.trim(),
        attachment_path: data.attachment?.path ?? null,
        attachment_name: data.attachment?.name ?? null,
        attachment_size: data.attachment?.size ?? null,
        attachment_mime_type: data.attachment?.mimeType ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const messageId = (inserted as { id: string }).id;
    const rows = data.targets.slice(0, 60).map((t) => ({
      message_id: messageId,
      target_type: t.target_type,
      target_role: t.target_role,
      target_year: t.target_year,
      target_shift: t.target_shift,
      target_course_id: t.target_course_id,
      target_person: t.target_person?.trim() || null,
    }));
    const { error: targetError } = await db.from("bib_message_targets").insert(rows as never);
    if (targetError) throw new Error(targetError.message);
    return { ok: true as const, id: messageId };
  });

export const bibInbox = createServerFn({ method: "POST" })
  .inputValidator(z.object({ audience: audienceSchema }))
  .handler(async ({ data }): Promise<InboxMessage[]> => {
    const audience = data.audience;
    if (!audience?.name?.trim()) return [];
    const db = await admin();

    const { data: messages, error } = await db
      .from("bib_messages")
      .select(MESSAGE_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const list = (messages ?? []) as MessageRow[];
    if (list.length === 0) return [];

    const ids = list.map((m) => m.id);
    const { data: targets } = await db
      .from("bib_message_targets")
      .select("message_id, target_type, target_role, target_year, target_shift, target_course_id, target_person")
      .in("message_id", ids);
    const { data: reads } = await db
      .from("bib_message_reads")
      .select("message_id, read_at, archived")
      .eq("reader_key", readerKeyOf(audience));

    const byMessage = new Map<string, TargetInput[]>();
    for (const row of (targets ?? []) as ({ message_id: string } & TargetInput)[]) {
      const arr = byMessage.get(row.message_id) ?? [];
      arr.push(row);
      byMessage.set(row.message_id, arr);
    }
    const readMap = new Map(
      ((reads ?? []) as { message_id: string; read_at: string | null; archived: boolean }[]).map(
        (r) => [r.message_id, r],
      ),
    );

    return list
      .map((m) => ({ ...m, targets: byMessage.get(m.id) ?? [] }))
      .filter((m) => m.targets.some((t) => matches(t, audience)))
      .map((m) => ({
        ...m,
        read_at: readMap.get(m.id)?.read_at ?? null,
        archived: readMap.get(m.id)?.archived ?? false,
      }));
  });

export const bibUpdateInboxState = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      audience: audienceSchema,
      id: z.string().uuid(),
      read: z.boolean().optional(),
      archived: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const row: Record<string, unknown> = {
      message_id: data.id,
      reader_key: readerKeyOf(data.audience),
    };
    if (data.read !== undefined) row.read_at = data.read ? new Date().toISOString() : null;
    if (data.archived !== undefined) row.archived = data.archived;
    const { error } = await db
      .from("bib_message_reads")
      .upsert(row as never, { onConflict: "message_id,reader_key" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bibSentMessages = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      role: staffRoleSchema,
      code: z.string().min(1).max(200),
      senderName: z.string().max(120),
    }),
  )
  .handler(async ({ data }) => {
    const role = await assertStaff(data.role, data.code);
    const db = await admin();
    const { data: messages, error } = await db
      .from("bib_messages")
      .select(MESSAGE_COLUMNS)
      .eq("sender_role", role)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const list = (messages ?? []) as MessageRow[];
    if (list.length === 0) return [];
    const { data: targets } = await db
      .from("bib_message_targets")
      .select("message_id, target_type, target_role, target_year, target_shift, target_course_id, target_person")
      .in(
        "message_id",
        list.map((m) => m.id),
      );
    const byMessage = new Map<string, TargetInput[]>();
    for (const row of (targets ?? []) as ({ message_id: string } & TargetInput)[]) {
      const arr = byMessage.get(row.message_id) ?? [];
      arr.push(row);
      byMessage.set(row.message_id, arr);
    }
    return list.map((m) => ({ ...m, targets: byMessage.get(m.id) ?? [] }));
  });
