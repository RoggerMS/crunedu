"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createQuestion } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

export default function NewQuestionPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) return setError("Inicia sesión para publicar.");
    setSubmitting(true);
    setError(null);
    try {
      await createQuestion({ title: title.trim(), content: content.trim() }, accessToken ?? "");
      router.push("/app/preguntas");
    } catch (err) {
      setError(mapApiError(err, "No se pudo crear la pregunta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black">Nueva pregunta</h1>
        <p className="mt-2 text-slate-600">Describe tu tarea con claridad para recibir una explicación útil.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-semibold">Título (5 a 160 caracteres)</label>
        <input className="w-full rounded-xl border border-slate-300 px-4 py-3" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label className="block text-sm font-semibold">Descripción del problema (10 a 5000 caracteres)</label>
        <textarea className="min-h-40 w-full rounded-xl border border-slate-300 px-4 py-3" maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} required />

        <label className="block text-sm font-semibold">Imagen del problema (próximamente)</label>
        <input disabled type="file" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-400" />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="rounded-xl bg-brand-600 px-5 py-2 font-semibold text-white disabled:opacity-70">{submitting ? "Publicando..." : "Publicar"}</button>
          <Link href="/app/preguntas" className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700">Cancelar</Link>
        </div>
      </form>
    </section>
  );
}
