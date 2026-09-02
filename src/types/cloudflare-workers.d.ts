// Tipado mínimo de "cloudflare:workers" — solo lo que usa src/lib/secrets.server.ts.
// No se incluye el archivo completo generado por `wrangler types`
// (worker-configuration.d.ts) a propósito: pisa tipos globales de DOM/lib
// usados por el resto del proyecto (código de cliente incluido). Si en algún
// momento se necesitan más bindings tipados, correr `npm run cf-typegen` y
// referenciar solo lo necesario, no el archivo completo.
interface SecretsStoreSecret {
  /** Devuelve el valor del secret, o lanza si no existe. */
  get(): Promise<string>;
}

declare module "cloudflare:workers" {
  export const env: Record<string, SecretsStoreSecret | string | undefined>;
}
