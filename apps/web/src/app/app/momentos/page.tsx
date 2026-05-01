"use client";

import { FormEvent, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

type CampusMoment = {
  id: number;
  title: string;
  description: string;
  votes: number;
};

const initialMoments: CampusMoment[] = [
  { id: 1, title: "Debate activo de Cálculo I", description: "Revisa los argumentos destacados sobre límites y derivadas de esta semana.", votes: 12 },
  { id: 2, title: "Trámite con más consultas", description: "La constancia de matrícula concentra más dudas en este momento.", votes: 8 },
  { id: 3, title: "Pregunta del momento", description: "¿Cómo organizar apuntes por curso sin perder contexto entre semanas?", votes: 6 },
];

export default function MomentsPage() {
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [moments, setMoments] = useState<CampusMoment[]>(initialMoments);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;

    setSubmitted(true);
    setContent("");
  }

  function handleVote(momentId: number) {
    setMoments((currentMoments) =>
      currentMoments.map((moment) =>
        moment.id === momentId
          ? { ...moment, votes: moment.votes + 1 }
          : moment,
      ),
    );
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

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Momentos relevantes de la comunidad</h2>
        <p className="text-sm text-slate-600">Vota por los temas más importantes para mantenerlos visibles.</p>
        <div className="space-y-3">
          {moments.map((moment) => (
            <article key={moment.id} className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900">{moment.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{moment.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">{moment.votes} votos</span>
                <button type="button" onClick={() => handleVote(moment.id)} className="rounded-xl border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                  Impulsar momento
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PageState
        type="success"
        title="Comparte un momento universitario"
        description="Publica actividades, fechas importantes o experiencias para que tu comunidad se mantenga informada."
      />
    </section>
  );
}
