import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { bestFaqMatch, lastUserMessage, normalize, type FaqEntry } from "@/lib/faq-search";

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(50),
});

const FALLBACK_REPLY =
  "No encontré materiales ni información sobre eso. Probá buscarlo desde Inicio, o revisá Novedades y Calendario en el menú.";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const YEAR_WORDS: Record<string, number> = {
  primero: 1,
  "1ro": 1,
  "1er": 1,
  segundo: 2,
  "2do": 2,
  tercero: 3,
  "3ro": 3,
  "3er": 3,
  cuarto: 4,
  "4to": 4,
  quinto: 5,
  "5to": 5,
  sexto: 6,
  "6to": 6,
};

/** Detecta un año escolar (1 a 6) mencionado en la consulta, en dígito o en palabras. */
function detectYear(flat: string): number | null {
  const digitMatch = flat.match(/\b([1-6])\s*(°|o|to|do|er|ro)?\s*an?o\b/);
  if (digitMatch?.[1]) return Number(digitMatch[1]);
  for (const [word, year] of Object.entries(YEAR_WORDS)) {
    if (flat.includes(word)) return year;
  }
  return null;
}

/**
 * Asistente de la Biblioteca Digital: responde por búsqueda directa sobre las
 * materias y materiales reales cargados, más una tabla de preguntas
 * frecuentes — sin IA ni claves de API externas, así nunca puede "inventar"
 * un material que no existe.
 */
export const bibAssistantChat = createServerFn({ method: "POST" })
  .inputValidator(chatSchema)
  .handler(async ({ data }) => {
    const question = lastUserMessage(data.messages);
    if (!question.trim()) return { reply: FALLBACK_REPLY };
    const flat = normalize(question);
    const db = await admin();

    if (/materia/.test(flat)) {
      const year = detectYear(flat);
      let query = db.from("bib_subjects").select("code, name, year").order("name");
      if (year) query = query.eq("year", year);
      const { data: subjects } = await query;
      const list = (subjects ?? []) as { code: string; name: string; year: number }[];
      if (list.length > 0) {
        const heading = year ? `Materias de ${year}.º año:` : "Materias cargadas:";
        return {
          reply: `${heading}\n${list.map((s) => `• ${s.name}${year ? "" : ` (${s.year}.º año)`}`).join("\n")}`,
        };
      }
    }

    const { data: resources } = await db
      .from("bib_resources")
      .select("title, subject_code, year, kind, topic")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(300);

    const terms = flat.split(/\s+/).filter((t) => t.length > 3);
    const matches = (
      (resources ?? []) as {
        title: string;
        subject_code: string;
        year: number;
        kind: string;
        topic: string | null;
      }[]
    )
      .filter((r) => {
        const haystack = normalize(`${r.title} ${r.topic ?? ""} ${r.subject_code}`);
        return terms.some((term) => haystack.includes(term));
      })
      .slice(0, 6);

    if (matches.length > 0) {
      return {
        reply: `Encontré estos materiales:\n${matches.map((r) => `• "${r.title}" · ${r.subject_code} · ${r.year}.º año`).join("\n")}`,
      };
    }

    const { data: faqRows, error } = await db
      .from("site_faq")
      .select("id, question, answer, keywords")
      .eq("category", "biblioteca");
    if (error) console.error("Error al buscar FAQ de biblioteca:", error);

    const match = bestFaqMatch((faqRows ?? []) as FaqEntry[], question);
    return { reply: match?.answer ?? FALLBACK_REPLY };
  });
