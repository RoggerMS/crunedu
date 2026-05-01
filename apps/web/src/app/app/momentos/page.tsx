"use client";

import { FormEvent, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

export default function MomentsPage() {
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;

    setSubmitted(true);
    setContent("");
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Momentos" description="Comparte lo que está pasando en el campus y conversa con tu comunidad." />

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Publicar momento universitario</h2>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="¿Qué está pasando hoy en tu facultad?"
        />
        <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Compartir momento</button>
        {submitted ? <p className="text-sm text-emerald-700">Tu momento quedó listo para publicarse.</p> : null}
      </form>

      <PageState
        type="success"
        title="Comparte un momento universitario"
        description="Publica actividades, fechas importantes o experiencias para que tu comunidad se mantenga informada."
      />
    </section>
  );
}
