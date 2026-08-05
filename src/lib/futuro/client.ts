import { createClient } from "@supabase/supabase-js";

// Backend propio de la plataforma "Tu Futuro" (orientación estudiantil).
const FUTURO_URL = "https://jkgwdvprmcrymajeysxh.supabase.co";
const FUTURO_KEY = "sb_publishable_whbwVpavw2FeuzpyYmFEGw_CdLnihPF";

function futuroFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export const futuro = createClient(FUTURO_URL, FUTURO_KEY, {
  global: { fetch: futuroFetch(FUTURO_KEY) },
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "sb-futuro-ees6-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});
