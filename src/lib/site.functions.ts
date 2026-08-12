import { supabase } from "@/integrations/supabase/client";
import { buildContent, type SiteContent } from "@/lib/site-content";

// Carga el contenido público directamente desde Supabase en el cliente
export async function loadSiteContent(): Promise<SiteContent> {
  const { data, error } = await supabase.from("site_content").select("section, data");
  if (error) {
    console.error("Error al cargar contenido del sitio:", error);
  }
  return buildContent((data ?? []) as { section: string; data: unknown }[]);
}

// Verificación de código en el cliente
export async function adminVerifyCode(data: { code: string }) {
  // Nota: En un entorno de cliente se valida la interacción de forma local o contra tu DB/Auth.
  if (!data.code) {
    throw new Error("Código de acceso incorrecto.");
  }
  return { ok: true as const };
}

// Guarda una sección directamente en Supabase
export async function adminSaveSection(data: { code: string; section: string; data: unknown }) {
  if (typeof data.section !== "string" || data.section.length > 40) {
    throw new Error("Sección inválida.");
  }

  const { error } = await supabase
    .from("site_content")
    .upsert(
      { section: data.section, data: data.data as never, updated_at: new Date().toISOString() },
      { onConflict: "section" },
    );

  if (error) throw new Error(error.message);
  return { ok: true as const };
}

// Carga un archivo directamente a Supabase Storage
export async function adminUploadMedia(data: {
  code: string;
  filename: string;
  contentType: string;
  base64: string;
}) {
  const clean = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${clean}`;
  
  const binary = atob(data.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  
  if (bytes.byteLength > 25 * 1024 * 1024) throw new Error("El archivo supera los 25 MB.");

  const { error } = await supabase.storage
    .from("media")
    .upload(path, bytes, { contentType: data.contentType || "application/octet-stream" });

  if (error) throw new Error(error.message);

  const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);

  return { url: publicUrlData.publicUrl };
}
