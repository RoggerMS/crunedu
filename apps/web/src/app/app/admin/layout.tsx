"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/http-client";

const ADMIN_LINKS = [
  ["Resumen", "/app/admin"],
  ["Reportes", "/app/admin/reportes"],
  ["Usuarios", "/app/admin/usuarios"],
  ["Feed", "/app/admin/feed"],
  ["Comunidades", "/app/admin/comunidades"],
  ["Conversar", "/app/admin/conversar"],
  ["Preguntas", "/app/admin/preguntas"],
  ["Apuntes", "/app/admin/apuntes"],
  ["Universidad", "/app/admin/universidad"],
  ["Momentos", "/app/admin/momentos"],
  ["Tienda", "/app/admin/tienda"],
  ["Anuncios", "/app/admin/anuncios"],
  ["Ubicaciones", "/app/admin/ubicaciones"],
  ["Auditoría", "/app/admin/auditoria"],
  ["Sistema", "/app/admin/sistema"],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading, user } = useAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!accessToken || !isAdmin) return;
      try {
        const data = await apiRequest<{ sessions: Array<{ expiresAt: string }> }>("/admin/session", { headers: { Authorization: `Bearer ${accessToken}` } });
        const stored = typeof window !== "undefined" ? window.sessionStorage.getItem("crunedu_admin_session") : null;
        if (active) setSessionActive(Boolean(stored && data.sessions.some((s) => new Date(s.expiresAt).getTime() > Date.now())));
      } catch {
        if (active) setSessionActive(false);
      } finally {
        if (active) setSessionChecked(true);
      }
    }
    void check();
    return () => { active = false; };
  }, [accessToken, isAdmin]);

  async function submitStepUp(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await apiRequest<{ token: string; expiresAt: string }>("/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password }),
      });
      window.sessionStorage.setItem("crunedu_admin_session", data.token);
      setSessionActive(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la sesión administrativa.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || (isAuthenticated && isAdmin && !sessionChecked)) return <div className="p-6 text-sm text-slate-600">Cargando administración...</div>;
  if (!isAuthenticated) return <div className="p-6 text-sm text-slate-600">Redirigiendo al inicio de sesión...</div>;
  if (!isAdmin) return <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><h1 className="text-xl font-black">Acceso restringido</h1><p className="mt-2 text-sm">Esta sección solo está disponible para administradores.</p></div>;

  return (
    <div className="min-h-screen bg-slate-100 lg:-ml-64">
      <div className="flex">
        <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <Link href="/app" className="text-sm font-bold text-indigo-700">← Volver a CrunEdu</Link>
          <h2 className="mt-5 text-lg font-black">Administración</h2>
          <nav className="mt-4 space-y-1">
            {ADMIN_LINKS.map(([label, href]) => <Link key={href} href={href} className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === href ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>{label}</Link>)}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          {!sessionActive ? (
            <section className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h1 className="text-xl font-black">Reautenticación administrativa</h1>
              <p className="mt-2 text-sm text-slate-600">Escribe tu contraseña para abrir una sesión administrativa temporal de 20 minutos.</p>
              <form onSubmit={submitStepUp} className="mt-4 space-y-3">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Contraseña" />
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                <button disabled={submitting} className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{submitting ? "Validando..." : "Abrir sesión administrativa"}</button>
              </form>
            </section>
          ) : children}
        </main>
      </div>
    </div>
  );
}
