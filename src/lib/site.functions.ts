import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { chatbot } from "@/data/school";
import { buildContent, SECTION_LABELS, visible, type SiteContent } from "@/lib/site-content";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";

// Carga el contenido público directamente desde Supabase en el cliente
export async function loadSiteContent(): Promise<SiteContent> {
  const { data, error } = await supabase.from("site_content").select("section, data");
  if (error) {
    console.error("Error al cargar contenido del sitio:", error);
  }
  return buildContent((data ?? []) as { section: string; data: unknown }[]);
}

const siteChatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(30),
});

const SITE_ASSISTANT_PROMPT = `Sos "Lobi", el asistente virtual del sitio web institucional de la Escuela de Educación Secundaria N.º 6 de Lobos, Buenos Aires.
Respondé siempre en español rioplatense (es-AR), de forma breve, cálida y directa (2 a 4 oraciones como máximo).
Tu función es ayudar a quien visita la página a encontrar información y orientarlo hacia la sección correspondiente del sitio, nombrándola (ej: "Mirá la sección Noticias" o "Lo encontrás en Contacto").
Si te preguntan algo que no tiene nada que ver con la escuela o con el contenido de esta página, respondé amablemente que solo podés ayudar con eso.
Usá el contexto a continuación como única fuente de verdad; si no tenés el dato, decilo y sugerí contactar a la escuela por teléfono, correo o Instagram en vez de inventar.`;

async function buildSiteAssistantContext(): Promise<string> {
  const content = await loadSiteContent();

  const sectionLines = content.sections.order
    .filter((s) => !s.hidden)
    .map((s) => `- ${SECTION_LABELS[s.key] ?? s.label}`)
    .join("\n");

  const faqLines = chatbot.options.map((o) => `- ${o.question}: ${o.answer}`).join("\n");

  const newsLines = visible(content.news.items)
    .slice(0, 6)
    .map((n) => `- [${n.date}] ${n.title}: ${n.excerpt}`)
    .join("\n");

  const eventsLines = visible(content.events.items)
    .slice(0, 8)
    .map((e) => `- ${e.date} (${e.type}): ${e.title}`)
    .join("\n");

  const { school } = content;
  return `Secciones disponibles en el sitio:
${sectionLines}

Preguntas frecuentes:
${faqLines}

Datos de la escuela:
- Nombre: ${school.name}
- Dirección: ${school.address}, ${school.city}
- Teléfono: ${school.phone}
- Correo: ${school.email}
- Instagram: ${school.instagramHandle}
- Ingreso: ${school.hours.entryGeneral}. ${school.hours.entryException}
- Salida: ${school.hours.exitGeneral}. ${school.hours.exitExceptions.join(". ")}

Noticias recientes:
${newsLines || "(sin noticias cargadas)"}

Próximos eventos:
${eventsLines || "(sin eventos cargados)"}`;
}

export const siteAssistantChat = createServerFn({ method: "POST" })
  .inputValidator(siteChatSchema)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("El asistente no está configurado en este momento.");

    const context = await buildSiteAssistantContext();
    const messages = [
      { role: "system", content: `${SITE_ASSISTANT_PROMPT}\n\n${context}` },
      ...data.messages.slice(-16),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "google/gemini-3-flash", messages }),
    });

    if (response.status === 429) {
      throw new Error("Demasiadas consultas, probá en unos minutos.");
    }
    if (response.status === 402) {
      throw new Error("Se agotaron los créditos de IA.");
    }
    if (!response.ok) {
      throw new Error("No pudimos comunicarnos con el asistente. Intentá de nuevo.");
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("El asistente no pudo generar una respuesta.");
    return { reply };
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
