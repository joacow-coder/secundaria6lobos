import { createServerFn } from "@tanstack/react-start";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `Sos el Asistente de la Biblioteca Digital de la Escuela de Educación Secundaria N.º 6 de Lobos.
Respondé siempre en español rioplatense (es-AR), de forma breve, clara y amable.
Tu única función es ayudar a estudiantes y docentes a encontrar y entender los materiales, novedades y fechas publicados en esta biblioteca digital institucional.
Si te preguntan algo que no tiene relación con la biblioteca o su contenido, respondé amablemente que solo podés ayudar con temas de la biblioteca digital.
Usá la lista de materias y materiales disponibles que te paso a continuación como contexto para orientar tus respuestas, pero no inventes materiales que no figuren ahí.`;

async function buildContext(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: subjects }, { data: resources }] = await Promise.all([
    supabaseAdmin.from("bib_subjects").select("code, name, year").order("name"),
    supabaseAdmin
      .from("bib_resources")
      .select("title, subject_code, year, kind, topic")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  const subjectLines = (subjects ?? [])
    .map((s: { code: string; name: string; year: number }) => `- ${s.code}: ${s.name} (${s.year}° año)`)
    .join("\n");

  const resourceLines = (resources ?? [])
    .map(
      (r: { title: string; subject_code: string; year: number; kind: string; topic: string | null }) =>
        `- "${r.title}" [${r.kind}] · ${r.subject_code} · ${r.year}° año${r.topic ? ` · tema: ${r.topic}` : ""}`,
    )
    .join("\n");

  return `Materias disponibles:\n${subjectLines || "(sin materias cargadas)"}\n\nMateriales publicados recientemente:\n${resourceLines || "(sin materiales cargados)"}`;
}

export const bibAssistantChat = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: ChatMessage[] }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("El asistente no está configurado en este momento.");

    const context = await buildContext();
    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
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
