// Búsqueda de preguntas frecuentes por palabras clave, sin IA: reemplaza al
// asistente basado en un modelo externo. Reutiliza el mismo enfoque de
// normalización y tolerancia a errores de tipeo que la búsqueda de la
// biblioteca (ver src/lib/biblioteca/utils.ts), pero desacoplado de esa
// pantalla porque este módulo corre en server functions de sitio y biblioteca.

export function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j] ?? 0;
      row[j] = Math.min(
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = current;
    }
  }
  return row[b.length] ?? 99;
}

export type FaqEntry = { id: string; question: string; answer: string; keywords: string[] };

/** Puntaje de relevancia de una FAQ para una consulta (0 = no coincide). */
export function scoreFaq(entry: FaqEntry, query: string): number {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;

  const fields: [string, number][] = [
    [entry.keywords.join(" "), 5],
    [entry.question, 3],
    [entry.answer, 1],
  ];

  let total = 0;
  for (const term of terms) {
    if (term.length < 4) continue; // ignora "de", "la", "el", "que", "por", etc.
    let best = 0;
    for (const [raw, weight] of fields) {
      const value = normalize(raw);
      if (!value) continue;
      if (value.includes(term)) {
        best = Math.max(best, weight);
        continue;
      }
      if (value.split(/\s+/).some((w) => w.length > 3 && editDistance(w, term) <= 1)) {
        best = Math.max(best, weight * 0.6);
      }
    }
    total += best;
  }
  return total;
}

/** Mejor coincidencia por encima del umbral, o null si ninguna FAQ es suficientemente relevante. */
export function bestFaqMatch(entries: FaqEntry[], query: string, threshold = 3): FaqEntry | null {
  let best: FaqEntry | null = null;
  let bestScore = 0;
  for (const entry of entries) {
    const score = scoreFaq(entry, query);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return bestScore >= threshold ? best : null;
}

export function lastUserMessage(messages: { role: string; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return messages[i]?.content ?? "";
  }
  return "";
}
