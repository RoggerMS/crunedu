"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleHeader } from "@/components/module-header";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { useAccessToken } from "@/hooks/useAccessToken";

export default function NewNotePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [cycle, setCycle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSending(true);
      setError(null);
      await apiRequest("/apuntes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title, description, course, cycle: cycle || undefined, fileUrl }),
      });
      router.push("/app/apuntes");
      router.refresh();
    } catch (submitError) {
      setError(mapApiError(submitError, "No se pudo publicar el apunte."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Nuevo apunte" description="Completa el formulario para publicar material académico." />

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Título del apunte" />
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Descripción del apunte" />
        <div className="grid gap-3 md:grid-cols-2">
          <input required value={course} onChange={(e) => setCourse(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Curso (ej. Cálculo I)" />
          <input value={cycle} onChange={(e) => setCycle(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Ciclo (ej. 2026-I)" />
        </div>

        <div className="rounded-2xl border border-slate-300 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Seleccionar archivo (PDF, Word, Excel, PPT)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
            className="block w-full text-sm text-slate-700"
          />
          <p className="mt-2 text-xs text-slate-500">{selectedFileName || "Aún no seleccionaste un archivo."}</p>
          <p className="mt-2 text-xs text-slate-500">Por ahora, pega también una URL del archivo para publicar mientras habilitamos la carga directa.</p>
        </div>

        <input required value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="URL pública del archivo" />

        <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
          <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1" />
          <span>
            Acepto los <Link href="/legal/terminos" className="font-semibold text-indigo-700 underline">términos y condiciones</Link> al publicar este apunte.
          </span>
        </label>

        <button disabled={!isAuthenticated || !acceptTerms || sending} type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {sending ? "Publicando..." : "Publicar apunte"}
        </button>
        {!isAuthenticated ? <p className="text-sm text-amber-700">Inicia sesión para publicar apuntes.</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </section>
  );
}
