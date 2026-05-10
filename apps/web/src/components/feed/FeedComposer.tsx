import { AlignLeft, FileUp, MessageCircle, MessageSquarePlus, NotebookPen, Sparkles } from "lucide-react";
import type { PostType } from "./types";

const quickTypes: Array<{ type: PostType; label: string; icon: typeof MessageSquarePlus }> = [
  { type: "publicacion", label: "Publicación", icon: MessageSquarePlus },
  { type: "apunte", label: "Apunte", icon: NotebookPen },
  { type: "pregunta", label: "Pregunta", icon: MessageCircle },
  { type: "momento", label: "Momento", icon: Sparkles },
  { type: "debate", label: "Debate", icon: AlignLeft },
  { type: "tramite", label: "Trámite", icon: FileUp },
];

export function FeedComposer({ onOpen }: { onOpen: (type: PostType) => void }) {
  return <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">CR</div>
      <button aria-label="Abrir modal para crear publicación" onClick={() => onOpen("publicacion")} className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-left text-sm text-slate-500 hover:border-indigo-300">¿Qué quieres compartir con tu comunidad?</button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">{quickTypes.map((item) => { const Icon = item.icon; const active = item.type === "publicacion"; return <button key={item.type} onClick={() => onOpen(item.type)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:border-indigo-200"}`}><Icon size={14} />{item.label}</button>; })}</div>
  </section>;
}
