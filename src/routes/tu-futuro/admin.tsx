import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { futuro } from "@/lib/futuro/client";
import { futuroSite } from "@/lib/futuro/site";

export const Route = createFileRoute("/tu-futuro/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await futuro.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/tu-futuro/auth" });
    }
  },
  head: () => ({
    meta: [{ title: "Panel de administración | Orientación Estudiantil EES N.º 6" }],
  }),
  component: AdminPage,
});

type CampoTipo = "select" | "textarea" | "number" | "date" | "lista" | undefined;

type Campo = {
  name: string;
  label: string;
  tipo?: CampoTipo;
  requerido?: boolean;
  opciones?: string[];
};

type Seccion = {
  tabla: string;
  label: string;
  titulo: string;
  subtitulo: string;
  orden: string;
  campos: Campo[];
};

const SECCIONES: Seccion[] = [
  {
    tabla: "instituciones",
    label: "Instituciones",
    titulo: "nombre",
    subtitulo: "ciudad",
    orden: "nombre",
    campos: [
      { name: "nombre", label: "Nombre", requerido: true },
      {
        name: "tipo",
        label: "Tipo",
        tipo: "select",
        opciones: ["universidad", "terciario", "formacion_profesional", "curso"],
      },
      { name: "ciudad", label: "Ciudad" },
      { name: "direccion", label: "Dirección" },
      { name: "distancia_km", label: "Distancia desde Lobos (km)", tipo: "number" },
      { name: "lat", label: "Latitud", tipo: "number" },
      { name: "lng", label: "Longitud", tipo: "number" },
      { name: "modalidad", label: "Modalidad" },
      { name: "contacto", label: "Contacto" },
      { name: "sitio_oficial", label: "Sitio oficial" },
      { name: "imagen_url", label: "URL de imagen" },
      { name: "descripcion", label: "Descripción", tipo: "textarea" },
      { name: "historia", label: "Sobre la institución", tipo: "textarea" },
      { name: "info_inscripcion", label: "Cómo inscribirse", tipo: "textarea" },
      { name: "como_llegar", label: "Cómo llegar", tipo: "textarea" },
      { name: "anio_actualizacion", label: "Año de actualización", tipo: "number" },
    ],
  },
  {
    tabla: "carreras",
    label: "Carreras",
    titulo: "nombre",
    subtitulo: "area",
    orden: "nombre",
    campos: [
      { name: "nombre", label: "Nombre", requerido: true },
      { name: "area", label: "Área" },
      { name: "institucion_id", label: "ID de institución" },
      { name: "duracion", label: "Duración (texto)" },
      { name: "duracion_anios", label: "Duración en años", tipo: "number" },
      { name: "modalidad", label: "Modalidad" },
      { name: "descripcion", label: "Descripción", tipo: "textarea" },
      { name: "perfil", label: "Perfil del egresado", tipo: "textarea" },
      { name: "salidas_laborales", label: "Salidas laborales", tipo: "textarea" },
      { name: "requisitos", label: "Requisitos", tipo: "textarea" },
      { name: "materias", label: "Materias (separadas por coma)", tipo: "lista" },
      { name: "enlace_oficial", label: "Enlace al plan de estudios" },
      { name: "anio_actualizacion", label: "Año de actualización", tipo: "number" },
    ],
  },
  {
    tabla: "becas",
    label: "Becas",
    titulo: "nombre",
    subtitulo: "tipo",
    orden: "nombre",
    campos: [
      { name: "nombre", label: "Nombre", requerido: true },
      {
        name: "tipo",
        label: "Tipo",
        tipo: "select",
        opciones: [
          "nacional",
          "provincial",
          "universitaria",
          "ayuda",
          "transporte",
          "residencia",
        ],
      },
      { name: "descripcion", label: "Descripción", tipo: "textarea" },
      { name: "requisitos", label: "Requisitos", tipo: "textarea" },
      { name: "fecha_inicio", label: "Inicio de inscripción", tipo: "date" },
      { name: "fecha_cierre", label: "Cierre de inscripción", tipo: "date" },
      { name: "enlace_oficial", label: "Sitio oficial" },
      { name: "anio_actualizacion", label: "Año de actualización", tipo: "number" },
    ],
  },
  {
    tabla: "eventos",
    label: "Calendario",
    titulo: "titulo",
    subtitulo: "fecha_inicio",
    orden: "fecha_inicio",
    campos: [
      { name: "titulo", label: "Título", requerido: true },
      {
        name: "categoria",
        label: "Categoría",
        tipo: "select",
        opciones: ["inscripcion", "examen", "charla", "beca", "evento"],
      },
      { name: "fecha_inicio", label: "Fecha de inicio", tipo: "date", requerido: true },
      { name: "fecha_fin", label: "Fecha de fin", tipo: "date" },
      { name: "descripcion", label: "Descripción", tipo: "textarea" },
      { name: "enlace", label: "Enlace" },
    ],
  },
  {
    tabla: "noticias",
    label: "Noticias",
    titulo: "titulo",
    subtitulo: "fecha_publicacion",
    orden: "fecha_publicacion",
    campos: [
      { name: "titulo", label: "Título", requerido: true },
      { name: "fecha_publicacion", label: "Fecha de publicación", tipo: "date" },
      { name: "resumen", label: "Resumen", tipo: "textarea" },
      { name: "contenido", label: "Contenido", tipo: "textarea" },
      { name: "imagen_url", label: "URL de imagen" },
      { name: "enlace", label: "Enlace" },
    ],
  },
  {
    tabla: "recursos",
    label: "Recursos",
    titulo: "titulo",
    subtitulo: "categoria",
    orden: "orden",
    campos: [
      { name: "titulo", label: "Título", requerido: true },
      { name: "categoria", label: "Categoría" },
      { name: "resumen", label: "Resumen", tipo: "textarea" },
      { name: "contenido", label: "Contenido", tipo: "textarea" },
      { name: "enlace", label: "Enlace" },
      { name: "orden", label: "Orden", tipo: "number" },
    ],
  },
];

type Registro = Record<string, unknown> & { id?: string; archivado?: boolean };

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [seccion, setSeccion] = useState<Seccion>(SECCIONES[0]);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    futuro.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", seccion.tabla],
    queryFn: async () => {
      const { data: rows, error } = await futuro
        .from(seccion.tabla)
        .select("*")
        .order(seccion.orden);
      if (error) throw new Error(error.message);
      return (rows ?? []) as Registro[];
    },
  });

  const registros = useMemo(() => data ?? [], [data]);

  async function guardar(valores: Record<string, unknown>) {
    const payload: Record<string, unknown> = {};
    seccion.campos.forEach((campo) => {
      let valor = valores[campo.name];
      if (valor === "" || valor === undefined) valor = null;
      if (valor !== null && campo.tipo === "number") valor = Number(valor);
      if (campo.tipo === "lista") {
        valor =
          typeof valor === "string"
            ? valor
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : (valor ?? []);
      }
      if (valor !== null || campo.tipo !== "lista") payload[campo.name] = valor;
    });

    const tabla = futuro.from(seccion.tabla);
    const resultado = editando?.id
      ? await tabla.update(payload).eq("id", editando.id)
      : await tabla.insert(payload);

    if (resultado.error) {
      toast.error("No se pudo guardar", { description: resultado.error.message });
      return;
    }
    toast.success(editando?.id ? "Cambios guardados" : "Registro creado");
    setEditando(null);
    refetch();
    queryClient.invalidateQueries();
  }

  async function eliminar(registro: Registro) {
    if (!confirm(`¿Eliminar "${registro[seccion.titulo]}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const { error } = await futuro.from(seccion.tabla).delete().eq("id", registro.id);
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message });
      return;
    }
    toast.success("Registro eliminado");
    refetch();
    queryClient.invalidateQueries();
  }

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await futuro.auth.signOut();
    navigate({ to: "/tu-futuro/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/tu-futuro" className="flex items-center gap-3">
            <img src={futuroSite.logo} alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-display text-sm font-semibold">Panel de administración</p>
              <p className="text-xs text-muted-foreground">{email ?? "Equipo EES N.º 6"}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/tu-futuro"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={cerrarSesion}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {SECCIONES.map((s) => (
            <button
              key={s.tabla}
              type="button"
              onClick={() => {
                setSeccion(s);
                setEditando(null);
              }}
              className={
                seccion.tabla === s.tabla
                  ? "rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold">{seccion.label}</h1>
          <button
            type="button"
            onClick={() => setEditando({})}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>

        {editando && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const valores: Record<string, unknown> = {};
              seccion.campos.forEach((campo) => (valores[campo.name] = formData.get(campo.name)));
              guardar(valores);
            }}
            className="mt-6 rounded-xl border border-border bg-background p-6"
          >
            <h2 className="font-display text-base font-semibold">
              {editando.id ? "Editar registro" : "Nuevo registro"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {seccion.campos.map((campo) => {
                const valorActual = editando[campo.name];
                const defaultValue = Array.isArray(valorActual)
                  ? valorActual.join(", ")
                  : ((valorActual as string | number | undefined) ?? "");
                const inputClass =
                  "rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";
                return (
                  <label
                    key={campo.name}
                    className={`grid gap-1.5 text-xs font-semibold ${
                      campo.tipo === "textarea" ? "sm:col-span-2" : ""
                    }`}
                  >
                    {campo.label}
                    {campo.tipo === "textarea" ? (
                      <textarea
                        name={campo.name}
                        defaultValue={defaultValue}
                        rows={3}
                        className={inputClass}
                      />
                    ) : campo.tipo === "select" ? (
                      <select name={campo.name} defaultValue={defaultValue} className={inputClass}>
                        {campo.opciones?.map((opcion) => (
                          <option key={opcion} value={opcion}>
                            {opcion}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={campo.name}
                        type={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"}
                        step={campo.tipo === "number" ? "any" : undefined}
                        required={campo.requerido}
                        defaultValue={defaultValue}
                        className={inputClass}
                      />
                    )}
                  </label>
                );
              })}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
          {isLoading && (
            <p className="px-6 py-6 text-sm text-muted-foreground">Cargando…</p>
          )}
          <ul className="divide-y divide-border">
            {registros.map((registro) => (
              <li
                key={registro.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {registro[seccion.titulo] as string}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {String(registro[seccion.subtitulo] ?? "")}
                    {registro.archivado ? " · archivado" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditando(registro)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(registro)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {!isLoading && registros.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Todavía no hay registros en esta sección.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
