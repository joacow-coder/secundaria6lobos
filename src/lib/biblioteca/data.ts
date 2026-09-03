import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Subject = { code: string; name: string; year: number };

export type Shift = "manana" | "tarde" | "vespertino";
export type Course = { id: string; year: number; shift: Shift };

export type Resource = {
  id: string;
  title: string;
  description: string;
  subject_code: string;
  year: number;
  unit: string | null;
  topic: string | null;
  tags: string[];
  kind: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  provider: string | null;
  featured: boolean;
  views: number;
  downloads: number;
  teacher_id: string | null;
  teacher_name: string;
  course_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  subject_code: string | null;
  year: number | null;
  importance: string;
  pinned: boolean;
  teacher_name: string;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  event_type: string;
  subject_code: string | null;
  year: number | null;
  starts_at: string;
  ends_at: string | null;
  teacher_name: string;
  created_at: string;
};

const RESOURCE_COLUMNS =
  "id, title, description, subject_code, year, unit, topic, tags, kind, file_path, file_size, mime_type, external_url, provider, featured, views, downloads, teacher_id, teacher_name, course_id, deleted_at, created_at, updated_at";

export const subjectsQuery = queryOptions({
  queryKey: ["biblioteca", "subjects"],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<Subject[]> => {
    const { data, error } = await supabase
      .from("bib_subjects")
      .select("code, name, year")
      .order("name");
    if (error) throw error;
    return (data ?? []) as Subject[];
  },
});

export const coursesQuery = queryOptions({
  queryKey: ["biblioteca", "courses"],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<Course[]> => {
    const { data, error } = await supabase
      .from("bib_courses")
      .select("id, year, shift")
      .order("year")
      .order("shift");
    if (error) throw error;
    return (data ?? []) as Course[];
  },
});

export const resourcesQuery = queryOptions({
  queryKey: ["biblioteca", "resources"],
  queryFn: async (): Promise<Resource[]> => {
    const { data, error } = await supabase
      .from("bib_resources")
      .select(RESOURCE_COLUMNS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Resource[];
  },
});

export const announcementsQuery = queryOptions({
  queryKey: ["biblioteca", "announcements"],
  queryFn: async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from("bib_announcements")
      .select("id, title, body, subject_code, year, importance, pinned, teacher_name, created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Announcement[];
  },
});

export const calendarQuery = queryOptions({
  queryKey: ["biblioteca", "calendar_events"],
  queryFn: async (): Promise<CalendarEvent[]> => {
    const { data, error } = await supabase
      .from("bib_calendar_events")
      .select(
        "id, title, description, event_type, subject_code, year, starts_at, ends_at, teacher_name, created_at",
      )
      .order("starts_at");
    if (error) throw error;
    return (data ?? []) as CalendarEvent[];
  },
});

export const blockedWordsQuery = queryOptions({
  queryKey: ["biblioteca", "blocked_words"],
  staleTime: 1000 * 60 * 30,
  queryFn: async (): Promise<string[]> => {
    const { data, error } = await supabase.from("bib_blocked_words").select("word");
    if (error) throw error;
    return ((data ?? []) as { word: string }[]).map((row) => row.word);
  },
});

/** Archivos subidos por docentes: se sirven por una ruta pública del propio sitio. */
export function fileUrl(path: string, download = false): string {
  return `/api/public/biblioteca/${path}${download ? "?descargar=1" : ""}`;
}

export function subjectMap(subjects: Subject[]): Map<string, Subject> {
  return new Map(subjects.map((s) => [s.code, s]));
}