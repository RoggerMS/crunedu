import Link from "next/link";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import type { Conversation } from "@/modules/conversar/types";
import { getConversationRoute, getConversationTypeLabel } from "@/modules/conversar/utils";

type Props = {
  conversation: Conversation;
};

export function ConversarRecordingCard({ conversation }: Props) {
  const recordingRoute = getConversationRoute(conversation);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{getConversationTypeLabel(conversation.type)}</span>
        <span>{conversation.course ?? conversation.category}</span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{conversation.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{conversation.description}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>Duración: <span className="font-semibold text-slate-800">{conversation.recording?.durationLabel ?? "No disponible"}</span></p>
        <p>Reproducciones: <span className="font-semibold text-slate-800">{conversation.recording?.plays ?? 0}</span></p>
        <p>Creador: <span className="font-semibold text-slate-800">{conversation.createdBy.name}</span></p>
        <p>Estado: <span className="font-semibold text-slate-800">{getRecordingStatusLabel(conversation.recording?.status)}</span></p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={recordingRoute}><PrimaryButton type="button">Escuchar</PrimaryButton></Link>
        <SecondaryButton type="button" disabled>Guardar</SecondaryButton>
        <Link href={recordingRoute}><SecondaryButton type="button">Ver detalles</SecondaryButton></Link>
      </div>
    </article>
  );
}

function getRecordingStatusLabel(status?: Conversation["recording"]["status"]) {
  if (status === "processing") return "Procesándose";
  if (status === "restricted") return "Restringida";
  return "Grabación disponible";
}
