import { createFileRoute } from "@tanstack/react-router";
import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";
import { assertStaff } from "@/lib/biblioteca/staff-auth.server";
import { matches, type Audience, type TargetInput } from "@/lib/biblioteca/messages.functions";
import { canRenderInline, sanitizeHeaderFilename } from "@/lib/biblioteca/upload-safety.server";

type MessageRow = {
  sender_role: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime_type: string | null;
};

/**
 * Descarga de adjuntos de comunicados: a diferencia de la ruta pública de la
 * Biblioteca de materiales (deliberadamente abierta, es un catálogo), acá
 * hay que verificar que quien pide el archivo sea realmente uno de los
 * destinatarios del comunicado (o quien lo envió) antes de servirlo — un
 * comunicado dirigido a "3.º año" no puede ser accesible por nadie más
 * adivinando la URL.
 */
export const Route = createFileRoute("/api/private/comunicados/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        checkRateLimit(clientKey("comunicado-adjunto"));

        const id = (params as { id?: string }).id ?? "";
        if (!id) return new Response("Not found", { status: 404 });

        const url = new URL(request.url);
        const role = url.searchParams.get("role");
        const name = url.searchParams.get("name");
        const yearParam = url.searchParams.get("year");
        const shift = url.searchParams.get("shift");
        const courseId = url.searchParams.get("courseId");
        const staffRole = url.searchParams.get("staffRole");
        const staffCode = url.searchParams.get("staffCode");

        const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = await getSupabaseAdmin();

        const { data: message } = await db
          .from("bib_messages")
          .select("sender_role, attachment_path, attachment_name, attachment_mime_type")
          .eq("id", id)
          .maybeSingle();
        const row = message as MessageRow | null;
        if (!row?.attachment_path) return new Response("Not found", { status: 404 });

        let authorized = false;

        if (staffRole && staffCode) {
          try {
            const validated = await assertStaff(staffRole, staffCode);
            if (validated === row.sender_role) authorized = true;
          } catch {
            // Credenciales de staff inválidas: no autoriza por esta vía,
            // pero todavía puede autorizar por audiencia (destinatario).
          }
        }

        if (!authorized && role && name) {
          const { data: targets } = await db
            .from("bib_message_targets")
            .select("target_type, target_role, target_year, target_shift, target_course_id, target_person")
            .eq("message_id", id);
          const audience: Audience = {
            role: role as Audience["role"],
            name,
            year: yearParam ? Number(yearParam) : null,
            shift: shift || null,
            courseId: courseId || null,
            dni: null,
          };
          authorized = ((targets ?? []) as TargetInput[]).some((t) => matches(t, audience));
        }

        if (!authorized) return new Response("Forbidden", { status: 403 });

        const { data, error } = await db.storage.from("biblioteca").download(row.attachment_path);
        if (error || !data) return new Response("Not found", { status: 404 });

        const contentType = row.attachment_mime_type || data.type || "application/octet-stream";
        const download = url.searchParams.has("descargar");
        const filename = sanitizeHeaderFilename(
          row.attachment_name ?? row.attachment_path.split("/").pop() ?? "archivo",
        );
        const forceDownload = download || !canRenderInline(contentType);

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": contentType,
            "cache-control": "private, no-store",
            ...(forceDownload
              ? { "content-disposition": `attachment; filename="${filename}"` }
              : {}),
          },
        });
      },
    },
  },
});
