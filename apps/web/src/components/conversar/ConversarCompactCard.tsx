"use client";

import { Atom, Bookmark, Clock3, MoreHorizontal, Scale, Sigma, University, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Conversation } from "@/modules/conversar/types";

const iconByCategory: Record<string, { color: string; icon: LucideIcon }> = {
  "Matemática": { color: "bg-indigo-100 text-indigo-700", icon: Sigma },
  "Historia": { color: "bg-emerald-100 text-emerald-700", icon: University },
  "Física": { color: "bg-blue-100 text-blue-700", icon: Atom },
  "Tecnología / Educación": { color: "bg-violet-100 text-violet-700", icon: Scale },
  "default": { color: "bg-orange-100 text-orange-700", icon: Clock3 },
};

function getRoute(c: Conversation) { const liveOrWaiting = c.status === "live" || c.status === "waiting"; if (liveOrWaiting && c.type === "debate") return `/app/conversar/${c.id}/debate`; if (liveOrWaiting) return `/app/conversar/${c.id}`; return `/app/conversar/${c.id}/finalizada`; }
function getAction(c: Conversation, forceWaitingAction?: boolean) { if (forceWaitingAction || c.status === "waiting") return "Unirme a la sala"; if (c.type === "debate") return "Entrar al debate"; if (c.status === "finished" || c.status === "recorded") return "Ver grabación"; return "Entrar"; }

export function ConversarCompactCard({ conversation, forceWaitingAction = false }: { conversation: Conversation; forceWaitingAction?: boolean }) {
  const router = useRouter();
  const cfg = iconByCategory[conversation.category] ?? (conversation.type === "debate" ? iconByCategory["Tecnología / Educación"] : iconByCategory.default);
  const Icon = cfg.icon;

  return <article className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${cfg.color}`}><Icon size={28} /></div><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap gap-1 text-[11px] font-semibold">{conversation.status === "live" ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">En vivo</span> : null}{conversation.isRecording ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">Grabando</span> : null}{conversation.status === "waiting" ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">En espera</span> : null}{conversation.type === "debate" ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">Debate</span> : null}</div><h3 className="truncate text-base font-bold text-slate-900">{conversation.title}</h3><p className="text-sm text-slate-500">{conversation.course ?? conversation.category}</p></div><div className="w-full lg:w-80"><p className="line-clamp-2 text-sm text-slate-600">{conversation.description}</p><p className="mt-2 text-xs text-slate-500">{conversation.talkingCount} hablando · {conversation.listeningCount} escuchando</p>{conversation.type === "debate" && conversation.debateStances?.length ? <div className="mt-2 flex gap-1">{conversation.debateStances.slice(0,3).map((s)=><span key={s.id} className="rounded-full border border-violet-200 px-2 py-0.5 text-[11px] text-violet-700">{s.title}</span>)}</div>:null}</div><div className="flex items-center gap-2 lg:ml-auto"><button onClick={() => router.push(getRoute(conversation))} className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">{getAction(conversation, forceWaitingAction)}</button><button className="rounded-lg border p-2 text-slate-500"><Bookmark size={16} /></button><button className="rounded-lg border p-2 text-slate-500"><MoreHorizontal size={16} /></button></div></div></article>;
}
