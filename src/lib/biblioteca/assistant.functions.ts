import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { bestFaqMatch, lastUserMessage, normalize, type FaqEntry } from "@/lib/faq-search";

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(50),
  // DNI del alumno logueado, para acotar la respuesta a su propio año — se
  // ignora cualquier año que el cliente mande suelto y se busca el año real
  // guardado en `bib_students` para ese DNI. Docentes/personal no mandan DNI
  // y ven todos los años, igual que en el resto del panel.
  dni: z.string().trim().max(20).nullable().optional(),
});

const FALLBACK_REPLY =
  "No encontré materiales ni información sobre eso. Probá buscarlo desde Inicio, o revisá Novedades y Calendario en el menú.";

async function admin() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
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
 * un material que no existe. Cuando la consulta viene de un alumno (con
 * DNI), la respuesta queda acotada a su propio año lectivo: nunca sugiere
 * materias, materiales ni datos de otro año.
 */
const dniLookupSchema = /^\d{7,8}$/;

export const bibAssistantChat = createServerFn({ method: "POST" })
  .inputValidator(chatSchema)
  .handler(async ({ data }) => {
    const question = lastUserMessage(data.messages);
    if (!question.trim()) return { reply: FALLBACK_REPLY };
    const flat = normalize(question);
    const db = await admin();

    // El año del alumno se resuelve siempre contra `bib_students` por DNI —
    // nunca se confía en un año que venga suelto del cliente — así la IA
    // queda estrictamente acotada al año que le corresponde a ese DNI, sin
    // importar qué año detecte en el texto de la pregunta.
    let scopeYear: number | null = null;
    const dni = (data.dni ?? "").trim();
    if (dni && dniLookupSchema.test(dni)) {
      const { data: studentRow } = await db
        .from("bib_students")
        .select("year")
        .eq("dni", dni)
        .maybeSingle();
      scopeYear = (studentRow as { year: number } | null)?.year ?? null;
    }

    const askedYear = detectYear(flat);
    if (scopeYear !== null && askedYear !== null && askedYear !== scopeYear) {
      return {
        reply: `Solo puedo mostrarte materiales e información de tu propio año (${scopeYear}.º año). Para otros años, consultá con preceptoría o el equipo docente.`,
      };
    }

    if (/materia/.test(flat)) {
      const year = scopeYear ?? askedYear;
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

    let resourcesQuery = db
      .from("bib_resources")
      .select("title, subject_code, year, kind, topic")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(300);
    if (scopeYear !== null) resourcesQuery = resourcesQuery.eq("year", scopeYear);
    const { data: resources } = await resourcesQuery;

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
