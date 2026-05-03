"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

type CampusMoment = {
  id: number;
  content: string;
  createdAt: string;
  imageUrl?: string;
  sourceLabel?: string;
  sourceHref?: string;
};

export default function MomentsPage() {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [moments, setMoments] = useState<CampusMoment[]>([]);
  const [boostedMomentIds, setBoostedMomentIds] = useState<Set<number>>(new Set());

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;

    const nextMoment: CampusMoment = {
      id: Date.now(),
      content: content.trim(),
      createdAt: new Date().toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      imageUrl: imagePreviewUrl ?? undefined,
    };

    setMoments((currentMoments) => [nextMoment, ...currentMoments]);
    setSubmitted("Tu momento quedó publicado.");
    setContent("");
    setImageFile(null);
    setShowComposer(false);
  }

  function handleBoostToggle(momentId: number) {
    setBoostedMomentIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(momentId)) nextIds.delete(momentId);
      else nextIds.add(momentId);
      return nextIds;
    });
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Momentos" description="Comparte lo que está pasando en el campus y conversa con tu comunidad." />

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-black">Publicar momento universitario</h2>
          <button
            type="button"
            onClick={() => setShowComposer((current) => !current)}
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {showComposer ? "Cerrar publicación" : "Compartir momento"}
          </button>
        </div>
        <p className="text-sm text-slate-600">Comparte algo de inicio, comunidades, debates, preguntas, apuntes, trámites o de tu día a día en la universidad.</p>

        {showComposer ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="¿Qué está pasando hoy en tu facultad?"
            />
            <label className="block text-sm font-semibold text-slate-700">
              Agregar imagen
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm text-slate-600"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {imagePreviewUrl ? (
              <Image
                src={imagePreviewUrl}
                alt="Vista previa del momento"
                width={800}
                height={450}
                className="max-h-64 rounded-2xl border border-slate-200 object-cover"
              />
            ) : null}
            <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publicar</button>
          </form>
        ) : null}
        {submitted ? <p className="text-sm text-emerald-700">{submitted}</p> : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Momentos compartidos</h2>
        <p className="text-sm text-slate-600">Impulsa un momento una vez y vuelve a pulsar para quitar tu impulso. Por ahora es visual y no suma puntaje global.</p>
        <div className="space-y-3">
          {moments.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aún no hay momentos publicados. Sé la primera persona en compartir algo.</p> : null}
          {moments.map((moment) => (
            <article key={moment.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">{moment.createdAt}</p>
              <p className="mt-1 text-sm text-slate-700">{moment.content}</p>
              {moment.imageUrl ? (
                <Image
                  src={moment.imageUrl}
                  alt="Imagen del momento compartido"
                  width={1000}
                  height={560}
                  className="mt-3 max-h-80 w-full rounded-2xl border border-slate-200 object-cover"
                />
              ) : null}
              {moment.sourceHref && moment.sourceLabel ? <a className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline" href={moment.sourceHref}>{moment.sourceLabel}</a> : null}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">{boostedMomentIds.has(moment.id) ? "Impulso activo" : "Sin impulso activo"}</span>
                <button type="button" onClick={() => handleBoostToggle(moment.id)} className="rounded-xl border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                  {boostedMomentIds.has(moment.id) ? "Impulsado" : "Impulsar momento"}
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
