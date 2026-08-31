import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { buildContent, type SiteContent } from "@/lib/site-content";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";

// Carga el contenido público directamente desde Supabase en el cliente
export async function loadSiteContent(): Promise<SiteContent> {
  const { data, error } = await supabase.from("site_content").select("section, data");
  if (error) {
    console.error("Error al cargar contenido del sitio:", error);
  }
  return buildContent((data ?? []) as { section: string; data: unknown }[]);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Único punto de verificación del acceso al panel de administración del sitio.
 * Valida contra el código maestro institucional, del lado del servidor, con
 * el cliente de rol de servicio (bypassa RLS) — nunca con el cliente anon.
 */
function assertSiteAdmin(code: unknown): void {
  checkRateLimit(clientKey("site-admin"));
  const expected = process.env["SITE_ADMIN_MASTER_CODE"];
  if (!expected) throw new Error("El acceso al panel no está configurado.");
  if (typeof code !== "string" || !timingSafeEqual(code.trim(), expected)) {
    throw new Error("Código de acceso incorrecto.");
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const codeSchema = z.object({ code: z.string().min(1).max(200) });

export const adminVerifyCode = createServerFn({ method: "POST" })
  .inputValidator(codeSchema)
  .handler(async ({ data }) => {
    assertSiteAdmin(data.code);
    return { ok: true as const };
  });

export const adminSaveSection = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(1).max(200),
      section: z.string().min(1).max(40),
      data: z.unknown(),
    }),
  )
  .handler(async ({ data }) => {
    assertSiteAdmin(data.code);

    const db = await admin();

    let previousNewsIds = new Set<string>();
    if (data.section === "news") {
      const { data: prevRow } = await db
        .from("site_content")
        .select("data")
        .eq("section", "news")
        .maybeSingle();
      const prevItems = (prevRow?.data as { items?: { id: string }[] } | null)?.items ?? [];
      previousNewsIds = new Set(prevItems.map((it) => it.id));
    }

    const { error } = await db
      .from("site_content")
      .upsert(
        { section: data.section, data: data.data as never, updated_at: new Date().toISOString() },
        { onConflict: "section" },
      );

    if (error) throw new Error(error.message);

    if (data.section === "news") {
      const items = (data.data as { items?: { id: string; title: string; excerpt: string }[] })?.items ?? [];
      const newItems = items.filter((it) => !previousNewsIds.has(it.id));
      if (newItems.length > 0) {
        const { sendPushToAllSubscriptions } = await import("@/lib/push.functions");
        for (const it of newItems) {
          await sendPushToAllSubscriptions({ title: it.title, body: it.excerpt, url: "/#noticias" });
        }
      }
    }

    return { ok: true as const };
  });

export const adminUploadMedia = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(1).max(200),
      filename: z.string().min(1).max(255),
      contentType: z.string().max(100),
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    assertSiteAdmin(data.code);

    const clean = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    if (bytes.byteLength > 25 * 1024 * 1024) throw new Error("El archivo supera los 25 MB.");

    const db = await admin();
    const { error } = await db.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType || "application/octet-stream" });

    if (error) throw new Error(error.message);

    return { url: `/api/public/media/${path}` };
  });
