"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { createQuestion, uploadQuestionImage, type UploadedQuestionImage } from "@/lib/api-helpers";
import { AcademicComposer, type AcademicComposerImage } from "@/components/questions/AcademicComposer";
import { htmlToPlainText } from "@/components/questions/html-utils";
import { buildLoginHref } from "@/lib/auth-routes";
import { mapApiError } from "@/lib/http-client";

export default function NewQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isAuthenticated } = useAccessToken();
  const { communities } = useCommunities();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState<number | "">(searchParams.get("communityId") ? Number(searchParams.get("communityId")) : "");
  const [images, setImages] = useState<AcademicComposerImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const communityName = searchParams.get("communityName")?.trim() ?? "";
  const plainContentLength = useMemo(() => htmlToPlainText(content).length, [content]);
  const canSubmit = title.trim().length >= 5 && plainContentLength >= 10 && !submitting;
  const loginHref = buildLoginHref("/app/preguntas/nuevo");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!isAuthenticated) return setError("Inicia sesión para publicar tu pregunta.");
    if (plainContentLength < 10) return setError("La descripción debe tener al menos 10 caracteres.");
    setSubmitting(true);
    setError(null);
    try {
      const uploadedImages: UploadedQuestionImage[] = [];
      for (const image of images) uploadedImages.push(await uploadQuestionImage(image.file));
      const selectedCommunityId = typeof communityId === "number" && Number.isFinite(communityId) ? communityId : undefined;
      const created = await createQuestion({ title: title.trim(), content, communityId: selectedCommunityId, images: uploadedImages }, accessToken ?? "");
      router.push(`/app/preguntas/${created.id}`);
    } catch (err) {
      setError(mapApiError(err, "No se pudo crear la pregunta."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-[1120px] gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5">
          <Link href="/app/preguntas" className="text-sm font-semibold text-indigo-700">← Volver a Preguntas</Link>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Hacer una pregunta</h1>
          <p className="mt-2 text-slate-600">Escribe el enunciado completo, sube una foto clara de tu tarea y explica qué parte no entiendes.</p>
        </header>

        {!isAuthenticated ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Para publicar una pregunta necesitas iniciar sesión. <Link href={loginHref} className="font-bold text-indigo-700 underline">Iniciar sesión</Link>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="question-title">Título breve</label>
            <input
              id="question-title"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej.: ¿Cómo resuelvo este ejercicio de derivadas?"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Entre 5 y 160 caracteres.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="question-community">Asignatura o comunidad</label>
            <select
              id="question-community"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value ? Number(e.target.value) : "")}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Selecciona una asignatura (opcional)</option>
              {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {communityName ? <p className="mt-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800">Comunidad: {communityName}</p> : null}
          </div>

          <AcademicComposer
            mode="question"
            label="Descripción completa"
            value={content}
            onChange={setContent}
            placeholder="Copia el enunciado, cuenta qué intentaste y dónde te quedaste. Usa la barra para negrita, listas, símbolos o ecuaciones."
            maxLength={5000}
            allowImages
            images={images}
            onImagesChange={setImages}
            onError={setError}
            disabled={submitting}
          />

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!canSubmit || !isAuthenticated} className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none">{submitting ? "Publicando..." : "Publicar pregunta"}</button>
            <Link href="/app/preguntas" className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link>
          </div>
        </form>
      </div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Consejos para recibir ayuda</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Usa un título específico.</li>
          <li>Incluye el procedimiento que intentaste.</li>
          <li>Sube fotos nítidas y recortadas.</li>
          <li>No publiques datos personales.</li>
        </ul>
      </aside>
    </section>
  );
}
