import { useEffect, useState } from "react";

// Mismo criterio que la bottom nav (AppBottomNav usa lg:hidden): por debajo de
// este ancho consideramos "mobile o tablet" para el banner de instalación.
const INSTALL_BREAKPOINT = 1024;

/** true en mobile/tablet (<1024px), false en desktop; undefined hasta el primer render en cliente. */
export function useIsMobileOrTablet(): boolean {
  const [value, setValue] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${INSTALL_BREAKPOINT - 1}px)`);
    const update = () => setValue(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return !!value;
}
