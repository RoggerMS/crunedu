import { useMemo, useState } from "react";
import type { Conversation } from "@/modules/conversar/types";

type Tab = "chat"|"participants"|"links"|"materials";

export function ConversarRoomSidePanel({ conversation }: { conversation: Conversation }) {
  const [tab, setTab] = useState<Tab>("chat");
  const groups = useMemo(() => ({
    speaking: conversation.participants.filter((p) => p.status === "speaking" || p.status === "host"),
    handRaised: conversation.participants.filter((p) => p.status === "handRaised"),
    listening: conversation.participants.filter((p) => p.status === "listening"),
  }), [conversation.participants]);
  return <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
    <div className="flex flex-wrap gap-2">{(["chat","participants","links","materials"] as Tab[]).map((item)=><button key={item} type="button" onClick={()=>setTab(item)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${tab===item?"bg-indigo-600 text-white":"bg-slate-100 text-slate-700"}`}>{item==="chat"?"Chat":item==="participants"?"Participantes":item==="links"?"Enlaces":"Materiales"}</button>)}</div>
    {tab==="chat" && <div className="space-y-2 text-sm"><p><strong>Lucía:</strong> Chicos, revisen la opción D primero.</p><p><strong>Diego:</strong> Sí, esa parece proposición condicional.</p><p><strong>Camila:</strong> La C no es proposición porque es pregunta.</p><p><strong>Adrián:</strong> ¿Repasamos tabla de verdad luego?</p></div>}
    {tab==="participants" && <div className="space-y-3 text-sm"><Group title="Hablando" names={groups.speaking.map((p)=>p.user.name)} /><Group title="Mano levantada" names={groups.handRaised.map((p)=>p.user.name)} /><Group title="Escuchando" names={groups.listening.map((p)=>p.user.name)} /></div>}
    {tab==="links" && <div className="space-y-3">{conversation.sharedLinks.map((link)=><article key={link.id} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-semibold text-slate-900">{link.title}</p><p className="text-xs text-slate-500">{link.domain} · compartió {link.sharedBy.name}</p><div className="mt-2 flex gap-2"><button type="button" className="rounded-lg bg-slate-100 px-2 py-1 text-xs">Abrir</button><button type="button" className="rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700">Reportar</button></div></article>)}{!conversation.sharedLinks.length && <p className="text-sm text-slate-500">No hay enlaces todavía.</p>}</div>}
    {tab==="materials" && <div className="space-y-3">{conversation.materials.map((material)=><article key={material.id} className="rounded-xl border border-slate-200 p-3 text-sm"><p className="font-semibold text-slate-900">{material.title}</p><p className="text-xs text-slate-500">{material.type.toUpperCase()}{material.size ? ` · ${material.size}` : ""}</p><div className="mt-2 flex gap-2"><button type="button" className="rounded-lg bg-slate-100 px-2 py-1 text-xs">Ver</button><button type="button" className="rounded-lg bg-slate-100 px-2 py-1 text-xs">Guardar</button></div></article>)}{!conversation.materials.length && <p className="text-sm text-slate-500">No hay materiales todavía.</p>}</div>}
  </aside>;
}

function Group({ title, names }: { title: string; names: string[] }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><ul className="mt-1 list-disc pl-5">{names.length ? names.map((name)=><li key={name}>{name}</li>) : <li className="text-slate-400">Sin participantes</li>}</ul></div>; }
