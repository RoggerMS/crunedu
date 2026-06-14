"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createQuestion, uploadQuestionImage, type UploadedQuestionImage } from "@/lib/api-helpers";
import { buildLoginHref } from "@/lib/auth-routes";
import { mapApiError } from "@/lib/http-client";

type LocalImage = { id: string; file: File; previewUrl: string };

export default function NewQuestionPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const loginHref = buildLoginHref("/app/preguntas/nuevo");
  const canSubmit = useMemo(() => title.trim().length >= 5 && content.trim().length >= 10 && !submitting, [title, content, submitting]);

  function onImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 3 * 1024 * 1024);
    if (validFiles.length !== files.length) setError("Solo puedes adjuntar imágenes JPG, PNG o WEBP de hasta 3MB.");
    setImages((current) => [...current, ...validFiles.slice(0, Math.max(0, 4 - current.length)).map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file) }))]);
    event.target.value = "";
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || submitLockRef.current) return;
    if (!isAuthenticated) return setError("Inicia sesión para publicar tu pregunta.");
    submitLockRef.current = true;
    setSubmitting(true);
    setError(null);
    let shouldUnlock = true;
    try {
      const uploadedImages: UploadedQuestionImage[] = [];
      for (const image of images) uploadedImages.push(await uploadQuestionImage(image.file));
      const created = await createQuestion({ title: title.trim(), content: content.trim(), images: uploadedImages }, accessToken ?? "");
      shouldUnlock = false;
      router.push(`/app/preguntas/${created.id}`);
    } catch (err) {
      setError(mapApiError(err, "No se pudo crear la pregunta."));
    } finally {
      if (shouldUnlock) {
        submitLockRef.current = false;
        setSubmitting(false);
      }
    }
  }

  return (
    <section className="mx-auto grid max-w-[1120px] gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5">
          <Link href="/app/preguntas" className="text-sm font-semibold text-indigo-700">← Volver a Preguntas</Link>
          <h1 className="mt-2 text-2xl font-black">Hacer una pregunta</h1>
          <p className="mt-2 text-slate-600">Escribe el enunciado completo, sube una foto clara de tu tarea y explica qué parte no entiendes.</p>
        </header>

        {!isAuthenticated ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Para publicar una pregunta necesitas iniciar sesión. <Link href={loginHref} className="font-bold text-indigo-700 underline">Iniciar sesión</Link>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label className="block text-sm font-semibold">Título breve</label>
            <input className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej.: ¿Cómo resuelvo este ejercicio de derivadas?" required />
            <p className="mt-1 text-xs text-slate-500">Entre 5 y 160 caracteres.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold">Descripción completa</label>
            <textarea className="mt-1 min-h-56 w-full rounded-xl border border-slate-300 px-4 py-3" maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Copia el enunciado, cuenta qué intentaste y dónde te quedaste." required />
            <p className="mt-1 text-xs text-slate-500">Puedes escribir hasta 5000 caracteres.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold">Imágenes de tu tarea</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImagesSelected} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" />
            <p className="mt-1 text-xs text-slate-500">Hasta 4 imágenes JPG, PNG o WEBP. Máximo 3MB cada una.</p>
            {images.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-xl border"><img src={image.previewUrl} alt="Vista previa de la tarea" className="h-44 w-full object-cover" /><button type="button" onClick={() => removeImage(image.id)} className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Quitar</button></div>)}</div> : null}
          </div>

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={!canSubmit || !isAuthenticated} className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none">{submitting ? "Publicando..." : "Publicar pregunta"}</button>
            <Link href="/app/preguntas" className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700">Cancelar</Link>
          </div>
        </form>
      </div>
      <aside className="h-fit rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Consejos para recibir ayuda</h2>
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
