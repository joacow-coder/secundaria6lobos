import { useEffect } from "react";

/** Registra el service worker (habilita instalabilidad + recepción de push). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  }, []);
  return null;
}
