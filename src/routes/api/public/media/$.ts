import { createFileRoute } from "@tanstack/react-router";
import { canRenderInline } from "@/lib/biblioteca/upload-safety.server";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
        const supabaseAdmin = await getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const contentType = data.type || "application/octet-stream";
        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=31536000, immutable",
            // Defensa en profundidad: aunque adminUploadMedia ya rechaza tipos
            // peligrosos al subir, esto cubre archivos subidos antes del fix.
            ...(canRenderInline(contentType)
              ? {}
              : { "content-disposition": "attachment" }),
          },
        });
      },
    },
  },
});
