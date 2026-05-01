"use client";

import { FormEvent, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

export default function ProceduresPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitted(true);
    setTitle("");
    setContent("");
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Trámites" description="Resuelve trámites con ayuda de experiencias reales de estudiantes." />

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Crear guía o consulta de trámite</h2>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Título del trámite"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Describe el proceso o tu duda"
        />
        <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publicar trámite</button>
        {submitted ? <p className="text-sm text-emerald-700">Tu publicación de trámite quedó preparada para enviarse.</p> : null}
      </form>

      <PageState
        type="empty"
        title="No hay guías activas por ahora"
        description="Publica una guía breve o una consulta específica para reunir experiencias reales del proceso."
      />
    </section>
  );
}
