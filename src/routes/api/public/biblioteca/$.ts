import { createFileRoute } from "@tanstack/react-router";

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

        const download = new URL(request.url).searchParams.has("descargar");
        const filename = path.split("/").pop() ?? "archivo";

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=3600",
            ...(download ? { "content-disposition": `attachment; filename="${filename}"` } : {}),
          },
        });
      },
    },
  },
});
