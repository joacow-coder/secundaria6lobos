import { getRequest } from "@tanstack/react-start/server";

const WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 8;

const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Freno simple contra fuerza bruta en los endpoints de verificación de
 * código maestro (site admin, docentes, personal). Vive en memoria del
 * isolate de Cloudflare Workers, así que no es consistente entre isolates
 * ni regiones — es un límite razonable contra scripts simples, no una
 * garantía distribuida. Para eso haría falta un binding de KV.
 */
export function checkRateLimit(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    throw new Error("Demasiados intentos. Probá de nuevo en unos minutos.");
  }
  entry.count += 1;
}

/** IP del request actual (Cloudflare la expone en `cf-connecting-ip`), prefijada por contexto. */
export function clientKey(prefix: string): string {
  const req = getRequest();
  const ip =
    req?.headers.get("cf-connecting-ip") ?? req?.headers.get("x-forwarded-for") ?? "unknown";
  return `${prefix}:${ip}`;
}
