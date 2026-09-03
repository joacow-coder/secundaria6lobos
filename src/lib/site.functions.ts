import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { school } from "@/data/school";
import { buildContent, visible, type SiteContent } from "@/lib/site-content";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";
import { bestFaqMatch, lastUserMessage, normalize, type FaqEntry } from "@/lib/faq-search";
import { getSecret } from "@/lib/secrets.server";
import { buildStoragePath } from "@/lib/biblioteca/storage-path.server";

// Carga el contenido público directamente desde Supabase en el cliente.
// Es el loader de la ruta "/": en una navegación SPA corre en el navegador,
// así que nunca debe dejar escapar una excepción (ni de la query ni de crear
// el cliente de Supabase) — eso tira abajo toda la ruta con la pantalla de
// error genérica del router en vez de mostrar el sitio con contenido default.
export async function loadSiteContent(): Promise<SiteContent> {
  try {
    const { data, error } = await supabase.from("site_content").select("section, data");
    if (error) {
      console.error("Error al cargar contenido del sitio:", error);
      return buildContent([]);
    }
    return buildContent((data ?? []) as { section: string; data: unknown }[]);
  } catch (error) {
    console.error("Error al cargar contenido del sitio:", error);
    return buildContent([]);
  }
}

const siteChatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(30),
});

const FALLBACK_REPLY = `No encontré información sobre eso. Podés contactar a la escuela: San Martín N.º 57, Lobos. Teléfono ${school.phone}, correo ${school.email} o Instagram ${school.instagramHandle}.`;

/**
 * Asistente "Lobi": responde por búsqueda de palabras clave contra la tabla
 * site_faq y el contenido real del sitio (noticias, eventos) — sin IA ni
 * claves de API externas. Determinístico y siempre basado en datos propios.
 */
export const siteAssistantChat = createServerFn({ method: "POST" })
  .inputValidator(siteChatSchema)
  .handler(async ({ data }) => {
    const question = lastUserMessage(data.messages);
    if (!question.trim()) return { reply: FALLBACK_REPLY };
    const flat = normalize(question);

    if (/\bnoticia/.test(flat)) {
      const content = await loadSiteContent();
      const items = visible(content.news.items).slice(0, 5);
      if (items.length > 0) {
        return {
          reply: `Noticias recientes:\n${items.map((n) => `• [${n.date}] ${n.title}`).join("\n")}\n\nMirá la sección Noticias del sitio para más detalle.`,
        };
      }
    }

    if (/\bevento|\bfecha/.test(flat)) {
      const content = await loadSiteContent();
      const items = visible(content.events.items).slice(0, 6);
      if (items.length > 0) {
        return {
          reply: `Próximos eventos:\n${items.map((e) => `• ${e.date} — ${e.title} (${e.type})`).join("\n")}\n\nMirá la sección Eventos del sitio para más detalle.`,
        };
      }
    }

    const { data: faqRows, error } = await supabase
      .from("site_faq")
      .select("id, question, answer, keywords")
      .eq("category", "general");
    if (error) console.error("Error al buscar FAQ:", error);

    const match = bestFaqMatch((faqRows ?? []) as FaqEntry[], question);
    return { reply: match?.answer ?? FALLBACK_REPLY };
  });

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
async function assertSiteAdmin(code: unknown): Promise<void> {
  checkRateLimit(clientKey("site-admin"));
  const expected = await getSecret("SITE_ADMIN_MASTER_CODE");
  if (!expected) throw new Error("El acceso al panel no está configurado.");
  if (typeof code !== "string" || !timingSafeEqual(code.trim(), expected)) {
    throw new Error("Código de acceso incorrecto.");
  }
}

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

const codeSchema = z.object({ code: z.string().min(1).max(200) });

export const adminVerifyCode = createServerFn({ method: "POST" })
  .inputValidator(codeSchema)
  .handler(async ({ data }) => {
    await assertSiteAdmin(data.code);
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
    await assertSiteAdmin(data.code);

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
      const items =
        (data.data as { items?: { id: string; title: string; excerpt: string }[] })?.items ?? [];
      const newItems = items.filter((it) => !previousNewsIds.has(it.id));
      if (newItems.length > 0) {
        const { sendPushToAllSubscriptions } = await import("@/lib/push-broadcast.server");
        for (const it of newItems) {
          await sendPushToAllSubscriptions({
            title: it.title,
            body: it.excerpt,
            url: "/#noticias",
          });
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
    await assertSiteAdmin(data.code);

    const path = buildStoragePath("sitio", data.filename);

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
