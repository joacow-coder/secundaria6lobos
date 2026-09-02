// Lee secrets: primero desde un binding de Cloudflare Secrets Store (si está
// declarado en wrangler.jsonc bajo `secrets_store_secrets`), si no desde
// process.env (local dev con .env, o "Variables and Secrets" del Worker).
//
// Por qué: el conector de GitHub de Cloudflare Workers Builds borra las
// variables y secrets configurados por el dashboard (y los cargados con
// `wrangler secret put`) en cada build automático — es un bug conocido de
// Cloudflare (github.com/cloudflare/workers-sdk/issues/8871), sin fix oficial
// todavía. Secrets Store es un servicio aparte: el binding se referencia por
// ID en wrangler.jsonc (versionado en git, sin exponer el valor), así que
// Cloudflare lo vuelve a aplicar solo en cada deploy, sin perderse nunca.
export async function getSecret(name: string): Promise<string | undefined> {
  try {
    const { env } = await import("cloudflare:workers");
    const binding = env[name];
    if (binding && typeof binding !== "string") return await binding.get();
    if (typeof binding === "string") return binding;
  } catch {
    // "cloudflare:workers" no disponible (fuera del runtime de Workers) — cae a process.env.
  }
  return process.env[name];
}
