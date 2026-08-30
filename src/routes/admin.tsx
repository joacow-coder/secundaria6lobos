import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  loadSiteContent,
  adminVerifyCode,
  adminSaveSection,
  adminUploadMedia,
} from "@/lib/site.functions";
import {
  SECTION_LABELS,
  defaultContent,
  type SectionKey,
  type SectionName,
  type SiteContent,
} from "@/lib/site-content";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de Administración — EES N.º 6 Lobos" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Acceso restringido al panel de administración del sitio." },
      { property: "og:title", content: "Panel de Administración — EES N.º 6 Lobos" },
      { property: "og:description", content: "Acceso restringido al panel de administración del sitio." },
    ],
  }),
  loader: () => loadSiteContent(),
  component: AdminPage,
});

const KEY = "ees6-admin-code";

function AdminPage() {
  const initial = Route.useLoaderData();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) setCode(saved);
  }, []);

  if (!code) return <Gate onUnlock={(c) => { sessionStorage.setItem(KEY, c); setCode(c); }} />;
  return <Panel code={code} initial={initial} onLock={() => { sessionStorage.removeItem(KEY); setCode(null); }} />;
}

function Gate({ onUnlock }: { onUnlock: (code: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminVerifyCode({ data: { code: value } });
      onUnlock(value.trim());
    } catch {
      setError("Código de acceso incorrecto. Acceso denegado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-cosmic px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-elegant"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-navy text-primary-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-xl font-extrabold text-brand-navy">
          Panel de Administración
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Ingresá el código de acceso para continuar.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Código de acceso"
          autoComplete="off"
          className="mt-6 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
        />
        {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={busy || !value}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Ingresar
        </button>
        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:underline">
          Volver al sitio
        </Link>
      </form>
    </div>
  );
}

const TABS: { name: SectionName; label: string }[] = [
  { name: "hero", label: "Inicio (Hero)" },
  { name: "history", label: "Historia" },
  { name: "anniversary", label: "Aniversario" },
  { name: "gallery", label: "Galería" },
  { name: "news", label: "Noticias" },
  { name: "events", label: "Eventos" },
  { name: "videos", label: "Multimedia" },
  { name: "comingSoon", label: "Próximamente" },
  { name: "school", label: "Datos institucionales" },
  { name: "sections", label: "Secciones y orden" },
];

function Panel({
  code,
  initial,
  onLock,
}: {
  code: string;
  initial: SiteContent;
  onLock: () => void;
}) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<SectionName>("hero");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function update<K extends SectionName>(name: K, value: SiteContent[K]) {
    setContent((c) => ({ ...c, [name]: value }));
  }

  async function save(name: SectionName) {
    setSaving(true);
    setMsg("");
    try {
      await adminSaveSection({ data: { code, section: name, data: content[name] } });
      setMsg("Cambios guardados y publicados en el sitio.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 4000);
    }
  }

  const upload = async (file: File) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const res = await adminUploadMedia({
      data: { code, filename: file.name, contentType: file.type, base64 },
    });
    return res.url;
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-sm font-extrabold text-brand-navy">Panel de Administración</div>
            <div className="text-xs text-muted-foreground">EES N.º 6 — Lobos</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-full border border-border px-3 py-2 text-xs font-semibold">
              Ver sitio
            </Link>
            <button onClick={onLock} className="rounded-full bg-brand-navy px-3 py-2 text-xs font-semibold text-primary-foreground">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.name}
              onClick={() => setTab(t.name)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-sm font-medium transition ${
                tab === t.name
                  ? "bg-brand-navy text-primary-foreground shadow-card"
                  : "bg-card text-foreground/80 hover:bg-brand-sky/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="space-y-5">
          {msg && (
            <div className="rounded-xl bg-brand-sky/30 px-4 py-3 text-sm font-medium text-brand-navy">
              {msg}
            </div>
          )}

          <div className="rounded-3xl bg-card p-5 shadow-card sm:p-6">
            <Editor tab={tab} content={content} update={update} upload={upload} />
          </div>

          <button
            onClick={() => save(tab)}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </main>
      </div>
    </div>
  );
}

type Upload = (file: File) => Promise<string>;

function Editor({
  tab,
  content,
  update,
  upload,
}: {
  tab: SectionName;
  content: SiteContent;
  update: <K extends SectionName>(n: K, v: SiteContent[K]) => void;
  upload: Upload;
}) {
  if (tab === "hero") {
    const h = content.hero;
    return (
      <Fields title="Sección Inicio">
        <Text label="Año de referencia" value={String(h.badgeYear)} onChange={(v) => update("hero", { ...h, badgeYear: Number(v) || 0 })} />
        <Text label="Título principal" value={h.title} onChange={(v) => update("hero", { ...h, title: v })} />
        <Area label="Texto de bienvenida" value={h.subtitle} onChange={(v) => update("hero", { ...h, subtitle: v })} />
        <Text label="Botón principal" value={h.primaryCta} onChange={(v) => update("hero", { ...h, primaryCta: v })} />
        <Text label="Botón secundario" value={h.secondaryCta} onChange={(v) => update("hero", { ...h, secondaryCta: v })} />
      </Fields>
    );
  }

  if (tab === "history") {
    const h = content.history;
    return (
      <Fields title="Historia, misión y valores">
        <Text label="Etiqueta" value={h.eyebrow} onChange={(v) => update("history", { ...h, eyebrow: v })} />
        <Text label="Título" value={h.title} onChange={(v) => update("history", { ...h, title: v })} />
        <Area label="Introducción" value={h.intro} onChange={(v) => update("history", { ...h, intro: v })} />
        <Area label="Mensaje de cierre" value={h.closing} onChange={(v) => update("history", { ...h, closing: v })} />
        <Area label="Misión" value={h.mission} onChange={(v) => update("history", { ...h, mission: v })} />
        <Area label="Visión" value={h.vision} onChange={(v) => update("history", { ...h, vision: v })} />
        <List
          label="Línea de tiempo"
          items={h.timeline}
          onChange={(timeline) => update("history", { ...h, timeline })}
          create={() => ({ date: "", title: "", description: "" })}
          render={(item, set) => (
            <>
              <Text label="Fecha" value={item.date} onChange={(v) => set({ ...item, date: v })} />
              <Text label="Título" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Area label="Descripción" value={item.description} onChange={(v) => set({ ...item, description: v })} />
            </>
          )}
        />
        <List
          label="Valores"
          items={h.values}
          onChange={(values) => update("history", { ...h, values })}
          create={() => ({ title: "", desc: "" })}
          render={(item, set) => (
            <>
              <Text label="Título" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Area label="Descripción" value={item.desc} onChange={(v) => set({ ...item, desc: v })} />
            </>
          )}
        />
      </Fields>
    );
  }

  if (tab === "anniversary") {
    const a = content.anniversary;
    return (
      <Fields title="Aniversario">
        <Text label="Etiqueta" value={a.eyebrow} onChange={(v) => update("anniversary", { ...a, eyebrow: v })} />
        <Text label="Título" value={a.title} onChange={(v) => update("anniversary", { ...a, title: v })} />
        <Area label="Texto" value={a.text} onChange={(v) => update("anniversary", { ...a, text: v })} />
      </Fields>
    );
  }

  if (tab === "gallery") {
    const g = content.gallery;
    return (
      <Fields title="Galería">
        <List
          label="Publicaciones"
          items={g.items}
          onChange={(items) => update("gallery", { items })}
          create={() => ({ id: crypto.randomUUID(), url: "", category: "General", title: "", description: "" })}
          render={(item, set) => (
            <>
              <Image label="Imagen" value={item.url} onChange={(v) => set({ ...item, url: v })} upload={upload} />
              <Text label="Categoría" value={item.category} onChange={(v) => set({ ...item, category: v })} />
              <Text label="Título" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Area label="Descripción" value={item.description} onChange={(v) => set({ ...item, description: v })} />
            </>
          )}
        />
      </Fields>
    );
  }

  if (tab === "news") {
    const n = content.news;
    return (
      <Fields title="Noticias y novedades">
        <List
          label="Publicaciones"
          items={n.items}
          onChange={(items) => update("news", { items })}
          create={() => ({ id: crypto.randomUUID(), image: "", date: "", title: "", excerpt: "" })}
          render={(item, set) => (
            <>
              <Image label="Imagen" value={item.image} onChange={(v) => set({ ...item, image: v })} upload={upload} />
              <Text label="Fecha" value={item.date} onChange={(v) => set({ ...item, date: v })} />
              <Text label="Título" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Area label="Resumen" value={item.excerpt} onChange={(v) => set({ ...item, excerpt: v })} />
            </>
          )}
        />
      </Fields>
    );
  }

  if (tab === "events") {
    const e = content.events;
    return (
      <Fields title="Eventos / calendario">
        <List
          label="Eventos"
          items={e.items}
          onChange={(items) => update("events", { items })}
          create={() => ({ id: crypto.randomUUID(), date: "", title: "", type: "Institucional" })}
          render={(item, set) => (
            <>
              <Text label="Fecha" value={item.date} onChange={(v) => set({ ...item, date: v })} />
              <Text label="Título" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Text label="Tipo" value={item.type} onChange={(v) => set({ ...item, type: v })} />
            </>
          )}
        />
      </Fields>
    );
  }

  if (tab === "videos") {
    const v = content.videos;
    return (
      <Fields title="Multimedia">
        <List
          label="Videos"
          items={v.items}
          onChange={(items) => update("videos", { items })}
          create={() => ({ id: crypto.randomUUID(), url: "", title: "" })}
          render={(item, set) => (
            <>
              <Image label="Archivo de video o URL" value={item.url} onChange={(u) => set({ ...item, url: u })} upload={upload} accept="video/*" preview={false} />
              <Text label="Título" value={item.title} onChange={(t) => set({ ...item, title: t })} />
            </>
          )}
        />
      </Fields>
    );
  }

  if (tab === "comingSoon") {
    const c = content.comingSoon;
    return (
      <Fields title="Próximamente">
        <Area label="Texto introductorio" value={c.intro} onChange={(v) => update("comingSoon", { ...c, intro: v })} />
        <List
          label="Tarjetas"
          items={c.items}
          onChange={(items) => update("comingSoon", { ...c, items })}
          create={() => ({ id: crypto.randomUUID(), icon: "✨", title: "", desc: "" })}
          render={(item, set) => (
            <>
              <Text label="Ícono (emoji)" value={item.icon} onChange={(v) => set({ ...item, icon: v })} />
              <Text label="Título" value={item.title} onChange={(v) => set({ ...item, title: v })} />
              <Area label="Descripción" value={item.desc} onChange={(v) => set({ ...item, desc: v })} />
            </>
          )}
        />
      </Fields>
    );
  }

  if (tab === "school") {
    const s = content.school;
    const set = (patch: Partial<typeof s>) => update("school", { ...s, ...patch });
    return (
      <Fields title="Datos institucionales y contacto">
        <Image label="Logo" value={s.logo} onChange={(v) => set({ logo: v })} upload={upload} />
        <Text label="Nombre" value={s.name} onChange={(v) => set({ name: v })} />
        <Text label="Nombre corto" value={s.shortName} onChange={(v) => set({ shortName: v })} />
        <Text label="Ciudad" value={s.city} onChange={(v) => set({ city: v })} />
        <Text label="Dirección" value={s.address} onChange={(v) => set({ address: v })} />
        <Text label="Teléfono" value={s.phone} onChange={(v) => set({ phone: v })} />
        <Text label="Correo" value={s.email} onChange={(v) => set({ email: v })} />
        <Text label="Instagram (URL)" value={s.instagram} onChange={(v) => set({ instagram: v })} />
        <Text label="Instagram (usuario)" value={s.instagramHandle} onChange={(v) => set({ instagramHandle: v })} />
        <Text label="Facebook (URL)" value={s.facebook} onChange={(v) => set({ facebook: v })} />
        <Text label="Facebook (nombre)" value={s.facebookHandle} onChange={(v) => set({ facebookHandle: v })} />
        <Text label="Ingreso general" value={s.hours.entryGeneral} onChange={(v) => set({ hours: { ...s.hours, entryGeneral: v } })} />
        <Text label="Excepción de ingreso" value={s.hours.entryException} onChange={(v) => set({ hours: { ...s.hours, entryException: v } })} />
        <Text label="Salida general" value={s.hours.exitGeneral} onChange={(v) => set({ hours: { ...s.hours, exitGeneral: v } })} />
        <List
          label="Excepciones de salida"
          items={s.hours.exitExceptions.map((text, i) => ({ id: String(i), text }))}
          onChange={(rows) => set({ hours: { ...s.hours, exitExceptions: rows.map((r) => r.text) } })}
          create={() => ({ id: crypto.randomUUID(), text: "" })}
          hideToggle
          render={(item, setItem) => (
            <Text label="Texto" value={item.text} onChange={(v) => setItem({ ...item, text: v })} />
          )}
        />
      </Fields>
    );
  }

  // sections
  const order = content.sections.order;
  const move = (i: number, d: number) => {
    const next = [...order];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    update("sections", { order: next });
  };
  return (
    <Fields title="Secciones visibles y orden">
      <p className="text-sm text-muted-foreground">
        Ocultá o reordená las secciones de la página pública. Los cambios se aplican al guardar.
      </p>
      <div className="space-y-2">
        {order.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
            <span className="flex-1 text-sm font-semibold text-brand-navy">
              {SECTION_LABELS[s.key as SectionKey] ?? s.label}
            </span>
            <IconBtn onClick={() => move(i, -1)} title="Subir"><ArrowUp className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={() => move(i, 1)} title="Bajar"><ArrowDown className="h-4 w-4" /></IconBtn>
            <IconBtn
              title={s.hidden ? "Mostrar" : "Ocultar"}
              onClick={() => {
                const next = [...order];
                next[i] = { ...s, hidden: !s.hidden };
                update("sections", { order: next });
              }}
            >
              {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconBtn>
          </div>
        ))}
      </div>
      <button
        onClick={() => update("sections", defaultContent.sections)}
        className="text-xs font-semibold text-muted-foreground underline"
      >
        Restablecer orden original
      </button>
    </Fields>
  );
}

function Fields({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold text-brand-navy">{title}</h2>
      {children}
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
      />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value ?? ""}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
      />
    </label>
  );
}

function Image({
  label,
  value,
  onChange,
  upload,
  accept = "image/*",
  preview = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  upload: Upload;
  accept?: string;
  preview?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-start gap-3">
        {preview && value && (
          <img src={value} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-border" />
        )}
        <div className="flex-1 space-y-2">
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL del archivo"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-sky"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-sky/30 px-3 py-2 text-xs font-semibold text-brand-navy">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Subir archivo
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setError("");
                try {
                  onChange(await upload(file));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg bg-card text-brand-navy ring-1 ring-border transition hover:bg-brand-sky/30"
    >
      {children}
    </button>
  );
}

function List<T extends Record<string, any>>({
  label,
  items,
  onChange,
  create,
  render,
  hideToggle = false,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, set: (v: T) => void) => React.ReactNode;
  hideToggle?: boolean;
}) {
  const list = items ?? [];
  const set = (i: number, v: T) => onChange(list.map((x, k) => (k === i ? v : x)));
  const move = (i: number, d: number) => {
    const next = [...list];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-brand-navy">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...list, create()])}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
      {list.map((item, i) => (
        <div
          key={i}
          className={`space-y-3 rounded-2xl border border-border p-4 ${item.hidden ? "opacity-60" : ""}`}
        >
          <div className="flex items-center justify-end gap-2">
            <IconBtn onClick={() => move(i, -1)} title="Subir"><ArrowUp className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={() => move(i, 1)} title="Bajar"><ArrowDown className="h-4 w-4" /></IconBtn>
            {!hideToggle && (
              <IconBtn
                title={item.hidden ? "Mostrar" : "Ocultar"}
                onClick={() => set(i, { ...item, hidden: !item.hidden })}
              >
                {item.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </IconBtn>
            )}
            <IconBtn
              title="Eliminar"
              onClick={() => {
                if (confirm("¿Eliminar este elemento?")) onChange(list.filter((_, k) => k !== i));
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </IconBtn>
          </div>
          {render(item, (v) => set(i, v))}
        </div>
      ))}
      {list.length === 0 && (
        <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          Todavía no hay elementos. Usá “Agregar” para crear el primero.
        </p>
      )}
    </div>
  );
}
