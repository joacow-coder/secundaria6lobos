import { createFileRoute } from "@tanstack/react-router";
import { canRenderInline, sanitizeHeaderFilename } from "@/lib/biblioteca/upload-safety.server";

export const Route = createFileRoute("/api/public/biblioteca/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
        const supabaseAdmin = await getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.storage.from("biblioteca").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const contentType = data.type || "application/octet-stream";
        const download = new URL(request.url).searchParams.has("descargar");
        const filename = sanitizeHeaderFilename(path.split("/").pop() ?? "archivo");
        // Defensa en profundidad: solo imágenes/PDF se dejan renderizar
        // inline; todo lo demás se fuerza a descargar aunque no se haya
        // pedido explícitamente (cubre archivos subidos antes de validar
        // el content-type en la subida).
        const forceDownload = download || !canRenderInline(contentType);

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=3600",
            ...(forceDownload
              ? { "content-disposition": `attachment; filename="${filename}"` }
              : {}),
          },
        });
      },
    },
  },
});
