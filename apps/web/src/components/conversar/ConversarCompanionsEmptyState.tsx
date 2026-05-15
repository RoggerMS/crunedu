"use client";

import { PrimaryButton, SecondaryButton } from "@/components/ui";

type Props = { onCreate: () => void; onBack: () => void };

export function ConversarCompanionsEmptyState({ onCreate, onBack }: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-lg font-bold text-slate-900">No encontramos compañeros</h3>
      <p className="mt-2 text-sm text-slate-600">Prueba con otro tema, cambia los filtros o crea una conversación para que otros estudiantes se unan.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <PrimaryButton type="button" onClick={onCreate}>Crear conversación</PrimaryButton>
        <SecondaryButton type="button" onClick={onBack}>Volver a Conversar</SecondaryButton>
      </div>
    </article>
  );
}
