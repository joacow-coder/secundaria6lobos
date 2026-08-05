import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { futuro } from "@/lib/futuro/client";
import { futuroSite } from "@/lib/futuro/site";

export const Route = createFileRoute("/tu-futuro/auth")({
  head: () => ({
    meta: [{ title: "Acceso del equipo | Orientación Estudiantil EES N.º 6" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    futuro.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tu-futuro/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await futuro.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("No pudimos ingresar", { description: error.message });
      return;
    }
    navigate({ to: "/tu-futuro/admin" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-8">
        <img src={futuroSite.logo} alt="" className="h-12 w-12 object-contain" />
        <h1 className="mt-5 text-2xl font-bold">Acceso del equipo</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sección privada para el equipo directivo y de orientación que actualiza los contenidos
          de la plataforma.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Correo institucional
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-input bg-background px-4 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-input bg-background px-4 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Las cuentas las crea la dirección de la escuela. Si sos docente y necesitás acceso,
          escribí a {futuroSite.contacto}.
        </p>
      </div>
    </div>
  );
}
