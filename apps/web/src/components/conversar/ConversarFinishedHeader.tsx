import Link from "next/link";
import type { Conversation } from "@/modules/conversar/types";
import { getConversationTypeLabel } from "@/modules/conversar/utils";

export function ConversarFinishedHeader({ conversation }: { conversation: Conversation }) {
  const metadata = [conversation.course ?? conversation.category, getConversationTypeLabel(conversation.type), conversation.recording?.durationLabel ? `Duración: ${conversation.recording.durationLabel}` : null].filter(Boolean).join(" · ");
  return <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><Link href="/app/conversar" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800">← Volver a Conversar</Link><p className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">Conversación finalizada</p><h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{conversation.title}</h1><p className="mt-1 text-sm text-slate-600">{metadata}</p><p className="mt-1 text-sm font-medium text-slate-700">{getRecordingStatusLabel(conversation.recording?.status)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Reproducir</button><button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Guardar</button><Link href="/app/conversar/nueva" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Crear conversación relacionada</Link><button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Compartir</button></div></header>;
}

function getRecordingStatusLabel(status?: Conversation["recording"]["status"]) {
  if (status === "available") return "Grabación disponible";
  if (status === "processing") return "Grabación procesándose";
  if (status === "restricted") return "Grabación restringida";
  return "Grabación no disponible";
}
