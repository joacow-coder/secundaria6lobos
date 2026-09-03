import { checkRateLimit, clientKey } from "@/lib/rate-limit.server";
import { getSecret } from "@/lib/secrets.server";

export type StaffRole = "profesor" | "preceptor" | "directivo";

const CODE_ENV: Record<StaffRole, string> = {
  profesor: "TEACHER_MASTER_CODE",
  preceptor: "PRECEPTOR_MASTER_CODE",
  directivo: "DIRECTOR_MASTER_CODE",
};

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verificación central de credenciales del personal (docente, preceptor,
 * directivo). Único punto de la plataforma que valida estos códigos: el día
 * que se migre a usuarios y contraseñas, alcanza con reemplazar el cuerpo de
 * esta función.
 */
export async function assertStaff(role: unknown, code: unknown): Promise<StaffRole> {
  checkRateLimit(clientKey("staff"));
  const value = String(role ?? "") as StaffRole;
  const envName = CODE_ENV[value];
  if (!envName) throw new Error("Perfil no válido.");
  const expected = await getSecret(envName);
  if (!expected) throw new Error("Este acceso todavía no está configurado.");
  if (typeof code !== "string" || !timingSafeEqual(code.trim(), expected.trim())) {
    throw new Error("El código de acceso no es correcto.");
  }
  return value;
}
