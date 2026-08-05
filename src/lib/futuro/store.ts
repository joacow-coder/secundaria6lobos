import { useSyncExternalStore } from "react";

const KEY = "ees6-orientacion-memoria-v1";
const MAX_ITEMS = 12;
const MAX_BUSQUEDAS = 8;

export type Ref = { id: string; nombre: string };

export type Memoria = {
  version: number;
  visitasCarreras: Ref[];
  visitasInstituciones: Ref[];
  favoritosCarreras: Ref[];
  favoritosInstituciones: Ref[];
  busquedas: string[];
  filtros: Record<string, unknown> | null;
  resultadoTest: { areas: string[]; fecha: string } | null;
  ultimaSeccion: { path: string; label: string } | null;
  preferencias: Record<string, unknown> | null;
  visitas: number;
  ultimaVisita: string | null;
};

const EMPTY: Memoria = {
  version: 1,
  visitasCarreras: [],
  visitasInstituciones: [],
  favoritosCarreras: [],
  favoritosInstituciones: [],
  busquedas: [],
  filtros: null,
  resultadoTest: null,
  ultimaSeccion: null,
  preferencias: null,
  visitas: 0,
  ultimaVisita: null,
};

let cache: Memoria | null = null;
const listeners = new Set<() => void>();

function read(): Memoria {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  let next: Memoria;
  try {
    const raw = window.localStorage.getItem(KEY);
    next = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Memoria>) } : EMPTY;
  } catch {
    next = EMPTY;
  }
  cache = next;
  return cache;
}

function write(next: Memoria) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible */
  }
  listeners.forEach((fn) => fn());
}

function update(fn: (prev: Memoria) => Memoria) {
  if (typeof window === "undefined") return;
  write(fn(read()));
}

export function useMemoria(): Memoria {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}

const push = (list: Ref[], item: Ref) => [item, ...list.filter((i) => i.id !== item.id)].slice(0, MAX_ITEMS);

export const registrarVisitaCarrera = (item: Ref) =>
  update((m) => ({ ...m, visitasCarreras: push(m.visitasCarreras, item) }));

export const registrarVisitaInstitucion = (item: Ref) =>
  update((m) => ({ ...m, visitasInstituciones: push(m.visitasInstituciones, item) }));

export const toggleFavoritoCarrera = (item: Ref) =>
  update((m) => ({
    ...m,
    favoritosCarreras: m.favoritosCarreras.some((i) => i.id === item.id)
      ? m.favoritosCarreras.filter((i) => i.id !== item.id)
      : push(m.favoritosCarreras, item),
  }));

export const toggleFavoritoInstitucion = (item: Ref) =>
  update((m) => ({
    ...m,
    favoritosInstituciones: m.favoritosInstituciones.some((i) => i.id === item.id)
      ? m.favoritosInstituciones.filter((i) => i.id !== item.id)
      : push(m.favoritosInstituciones, item),
  }));

export function registrarBusqueda(term: string) {
  const t = term.trim();
  if (t.length < 3) return;
  update((m) => ({
    ...m,
    busquedas: [t, ...m.busquedas.filter((b) => b.toLowerCase() !== t.toLowerCase())].slice(
      0,
      MAX_BUSQUEDAS,
    ),
  }));
}

export const guardarFiltros = (filtros: Record<string, unknown> | null) =>
  update((m) => ({ ...m, filtros }));

export const guardarResultadoTest = (areas: string[]) =>
  update((m) => ({ ...m, resultadoTest: { areas, fecha: new Date().toISOString() } }));

export const setUltimaSeccion = (path: string, label: string) =>
  update((m) => (m.ultimaSeccion?.path === path ? m : { ...m, ultimaSeccion: { path, label } }));

export const guardarPreferencias = (prefs: Record<string, unknown>) =>
  update((m) => ({ ...m, preferencias: { ...prefs, fecha: new Date().toISOString() } }));

export const registrarVisita = () =>
  update((m) => ({ ...m, visitas: m.visitas + 1, ultimaVisita: new Date().toISOString() }));
