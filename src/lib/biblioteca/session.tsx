import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { bibVerifyStaffCode, type StaffRole, type Audience } from "./messages.functions";
import { bibVerifyStudent } from "./student.functions";

/**
 * Sesión de la Biblioteca Digital.
 *
 * Hoy el acceso docente usa un único código maestro institucional verificado
 * en el servidor. La interfaz `TeacherAuthStrategy` deja preparada la
 * migración futura a usuarios y contraseñas: alcanza con crear otra
 * implementación (por ejemplo, con email + contraseña) y usarla en
 * `teacherAuth`, sin tocar ninguna pantalla.
 */
export type TeacherIdentity = {
  full_name: string;
  /** Credencial que las funciones del servidor validan en cada operación. */
  credential: string;
  role: StaffRole;
};

export type TeacherAuthStrategy = {
  id: string;
  signIn(input: { code?: string; name?: string; role?: StaffRole }): Promise<TeacherIdentity>;
};

export const masterCodeStrategy: TeacherAuthStrategy = {
  id: "codigo-maestro",
  async signIn({ code, name, role = "profesor" }) {
    const value = (code ?? "").trim();
    await bibVerifyStaffCode({ data: { role, code: value } });
    return {
      full_name:
        (name ?? "").trim() ||
        (role === "preceptor"
          ? "Preceptoría"
          : role === "directivo"
            ? "Dirección"
            : "Equipo docente"),
      credential: value,
      role,
    };
  },
};

export const teacherAuth: TeacherAuthStrategy = masterCodeStrategy;

export type Student = {
  dni: string;
  name: string;
  since: string;
  year: number;
  courseId: string | null;
  shift: string | null;
};

type SessionState = {
  student: Student | null;
  teacher: TeacherIdentity | null;
  role: "alumno" | StaffRole | null;
  /** Identidad usada por el servidor para resolver la bandeja de notificaciones. */
  audience: Audience | null;
  favorites: string[];
  recents: string[];
  ready: boolean;
  signInStudent: (input: {
    dni: string;
    name: string;
    year: number;
    courseId?: string | null;
  }) => Promise<void>;
  signInTeacher: (input: { code?: string; name?: string; role?: StaffRole }) => Promise<void>;
  signOut: () => void;
  toggleFavorite: (id: string) => void;
  markRecent: (id: string) => void;
};

const KEYS = {
  student: "bib.student",
  teacher: "bib.teacher",
  favorites: "bib.favorites",
  recents: "bib.recents",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

const SessionContext = createContext<SessionState | null>(null);

export function BibliotecaSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<TeacherIdentity | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setStudent(read<Student | null>(KEYS.student, null));
    setTeacher(read<TeacherIdentity | null>(KEYS.teacher, null));
    setFavorites(read<string[]>(KEYS.favorites, []));
    setRecents(read<string[]>(KEYS.recents, []));
    setReady(true);
  }, []);

  const signInStudent = useCallback(
    async (input: { dni: string; name: string; year: number; courseId?: string | null }) => {
      const identity = await bibVerifyStudent({ data: input });
      const value: Student = {
        dni: identity.dni,
        name: identity.name,
        since: identity.since,
        year: identity.year,
        courseId: identity.courseId,
        shift: identity.shift,
      };
      // Un dispositivo tiene una única sesión activa: si había un docente
      // logueado antes (código maestro sin expiración en localStorage), se
      // descarta para que no quede "tapando" al alumno que acaba de
      // identificarse con su DNI (por ejemplo, en la bienvenida de Tu Futuro).
      setTeacher(null);
      write(KEYS.teacher, null);
      setStudent(value);
      write(KEYS.student, value);
    },
    [],
  );

  const signInTeacher = useCallback(
    async (input: { code?: string; name?: string; role?: StaffRole }) => {
      const identity = await teacherAuth.signIn(input);
      setStudent(null);
      write(KEYS.student, null);
      setTeacher(identity);
      write(KEYS.teacher, identity);
    },
    [],
  );

  const signOut = useCallback(() => {
    setStudent(null);
    setTeacher(null);
    write(KEYS.student, null);
    write(KEYS.teacher, null);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      write(KEYS.favorites, next);
      return next;
    });
  }, []);

  const markRecent = useCallback((id: string) => {
    setRecents((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 12);
      write(KEYS.recents, next);
      return next;
    });
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      student,
      teacher,
      role: teacher ? teacher.role : student ? "alumno" : null,
      audience: teacher
        ? {
            role: teacher.role,
            name: teacher.full_name,
            year: null,
            shift: null,
            courseId: null,
            dni: null,
          }
        : student
          ? {
              role: "alumno",
              name: student.name,
              year: student.year ?? null,
              shift: student.shift ?? null,
              courseId: student.courseId ?? null,
              dni: student.dni ?? null,
            }
          : null,
      favorites,
      recents,
      ready,
      signInStudent,
      signInTeacher,
      signOut,
      toggleFavorite,
      markRecent,
    }),
    [
      student,
      teacher,
      favorites,
      recents,
      ready,
      signInStudent,
      signInTeacher,
      signOut,
      toggleFavorite,
      markRecent,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useBibliotecaSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useBibliotecaSession debe usarse dentro de BibliotecaSessionProvider");
  return ctx;
}
