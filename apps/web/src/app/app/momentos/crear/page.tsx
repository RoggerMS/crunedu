"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MomentForm, type MomentFormPayload } from "@/components/moments/MomentForm";
import { createMoment, uploadMomentMedia } from "@/lib/moments-api";
import { useState } from "react";

export default function CreateMomentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(payload: MomentFormPayload) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await createMoment({
        title: payload.title,
        description: payload.description,
        location: payload.location,
        type: payload.type,
        tags: payload.tags,
        durationHours: payload.durationHours,
        isPermanent: payload.isPermanent,
        shareToFeed: payload.shareToFeed,
        media: payload.media,
      });
      router.push(`/app/momentos/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el momento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl space-y-4">
        <Link href="/app/momentos" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          <ArrowLeft size={16} /> Volver a Momentos
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Crear momento</h1>
          <p className="text-sm text-slate-600">
            Captura y comparte experiencias de la vida universitaria: momentos del campus, actividades, eventos o cualquier instancia que quieras recordar.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <MomentForm
            submitting={submitting}
            onCreate={handleCreate}
            onUpload={uploadMomentMedia}
            onDone={() => router.push("/app/momentos")}
          />
        </div>
      </div>
    </main>
  );
}
