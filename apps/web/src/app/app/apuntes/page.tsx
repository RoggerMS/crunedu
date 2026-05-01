"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

export default function NotesPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSuccessMessage("Tu apunte quedó listo para publicación. La conexión final se activará en el siguiente paso del módulo.");
    setTitle("");
    setContent("");
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Apuntes" description="Comparte material permitido y encuentra recursos para estudiar." />

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Crear apunte</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Título del apunte"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Contenido del apunte"
        />
        <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publicar apunte</button>
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      </form>

      <PageState
        type="empty"
        title="Aún no hay apuntes cargados"
        description="Puedes publicar el primer apunte de tu curso o sumarte a una comunidad para compartir material validado."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Crear apunte ahora</button>
            <Link href="/app/comunidades" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Ver comunidades</Link>
          </div>
        }
      />
    </section>
  );
}
