import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildContent, type SiteContent } from "@/lib/site-content";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function assertCode(code: unknown): void {
  const expected = process.env["ADMIN_ACCESS_CODE"];
  if (!expected) throw new Error("El panel no está configurado.");
  if (typeof code !== "string" || !timingSafeEqual(code.trim(), expected)) {
    throw new Error("Código de acceso incorrecto.");
  }
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const loadSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    const { data } = await publicClient().from("site_content").select("section, data");
    return buildContent((data ?? []) as { section: string; data: unknown }[]);
  },
);

export const adminVerifyCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    assertCode(data.code);
    return { ok: true as const };
  });

export const adminSaveSection = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; section: string; data: unknown }) => d)
  .handler(async ({ data }) => {
    assertCode(data.code);
    if (typeof data.section !== "string" || data.section.length > 40) {
      throw new Error("Sección inválida.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_content")
      .upsert(
        { section: data.section, data: data.data as never, updated_at: new Date().toISOString() },
        { onConflict: "section" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminUploadMedia = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { code: string; filename: string; contentType: string; base64: string }) => d,
  )
  .handler(async ({ data }) => {
    assertCode(data.code);
    const clean = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;
    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.byteLength > 25 * 1024 * 1024) throw new Error("El archivo supera los 25 MB.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType || "application/octet-stream" });
    if (error) throw new Error(error.message);
    return { url: `/api/public/media/${path}` };
  });
