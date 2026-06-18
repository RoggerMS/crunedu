"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { mapApiError, register } from "@/lib/api-helpers";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
      router.push(`/login?registered=1&email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(mapApiError(err, "No se pudo crear la cuenta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">Únete a CrunEdu para publicar, preguntar y participar en comunidades.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Nombre<input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 focus:ring" minLength={2} required /></label>
            <label className="block text-sm font-semibold text-slate-700">Apellido<input value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 focus:ring" minLength={2} required /></label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 focus:ring" placeholder="tu-correo@ejemplo.com" required /></label>
          <label className="block text-sm font-semibold text-slate-700">Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-indigo-200 focus:ring" minLength={8} required /><span className="mt-1 block text-xs font-normal text-slate-500">Usa al menos 8 caracteres.</span></label>
          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">{submitting ? "Creando cuenta..." : "Crear cuenta"}</button>
        </form>
        <p className="mt-5 text-sm text-slate-600">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Inicia sesión</Link></p>
      </div>
    </main>
  );
}
