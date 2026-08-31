import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "./integrations/supabase/auth-attacher";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// Headers de seguridad para toda respuesta (SSR, server routes y server functions).
// script-src/style-src necesitan 'unsafe-inline' porque <Scripts /> de TanStack
// Start inyecta el script de hidratación inline — endurecer con nonces queda
// fuera de alcance por ahora.
const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const headers = result.response.headers;
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org",
      "connect-src 'self' https://owmxbcsverzskddcaczx.supabase.co https://etztcmivbufdjnuarzwd.supabase.co",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  );
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, securityHeadersMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
