"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { mockDebates } from "@/components/debates";

export default function DebateDetailPage() {
  const params = useParams<{ id: string }>();
  const debate = useMemo(() => mockDebates.find((item) => item.id === params.id), [params.id]);
  const [saved, setSaved] = useState(Boolean(debate?.isSaved));
  if (!debate) return <main className="mx-auto max-w-[1540px] px-4 py-6">No encontramos este debate.</main>;

  return (<main className="mx-auto max-w-[1540px] space-y-4 px-4 py-6 sm:px-6 lg:px-8"><div className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap gap-2"><Link className="text-indigo-600" href="/app/debates">Volver a debates</Link><button onClick={() => setSaved((v) => !v)}>{saved ? "Guardado" : "Guardar"}</button><button onClick={async () => navigator.clipboard.writeText(`${window.location.origin}/app/debates/${debate.id}`)}>Compartir</button></div><h1 className="mt-2 text-2xl font-black">{debate.title}</h1><p className="mt-1 text-slate-600">{debate.description}</p><div className="mt-3 grid gap-2 md:grid-cols-2"><div className="rounded bg-emerald-50 p-3"><p className="font-bold">Postura A: {debate.sideA.label}</p><p className="text-sm">{debate.sideA.description}</p></div><div className="rounded bg-rose-50 p-3"><p className="font-bold">Postura B: {debate.sideB.label}</p><p className="text-sm">{debate.sideB.description}</p></div></div><h2 className="mt-4 font-bold">Argumentos</h2><div className="space-y-2">{debate.highlightedArguments.map((a)=><div key={a.id} className="rounded border p-2 text-sm"><b>{a.authorName}</b> ({a.side.toUpperCase()}): {a.content}</div>)}</div>{debate.highlightedArguments.length===0?<p className="text-sm text-slate-500">El resumen estará disponible cuando haya suficientes argumentos.</p>:null}</div></main>);
}
