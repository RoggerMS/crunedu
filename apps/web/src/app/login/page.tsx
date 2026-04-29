"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { buildApiUrl, mapApiError } from "@/lib/api";


export default function LoginPage() {
  const { setAccessToken } = useAccessToken();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(buildApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.accessToken) {
        const message = data?.message;
        const errorMessage = Array.isArray(message) ? message.join(" ") : message ?? "No se pudo iniciar sesión.";
        throw new Error(errorMessage);
      }

      setAccessToken(data.accessToken);
      setSuccessMessage("Sesión iniciada. Ya puedes publicar.");
      setPassword("");
    } catch (err) {
      setError(mapApiError(err, "No se pudo iniciar sesión."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">Ingresa con tu cuenta para poder publicar en el feed.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" key={retryCount}>
          <label className="block text-sm font-semibold text-slate-700">
            Correo
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring" placeholder="tu-correo@ejemplo.com" required />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Contraseña
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 transition focus:ring" placeholder="••••••••" minLength={8} required />
          </label>

          {error ? <div className="space-y-2"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={() => setRetryCount((prev) => prev + 1)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Reintentar</button></div> : null}
          {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

          <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
            {submitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-600">
          <Link href="/app" className="font-semibold text-indigo-600 hover:text-indigo-700">Volver al feed</Link>
        </div>
      </div>
    </main>
  );
}
