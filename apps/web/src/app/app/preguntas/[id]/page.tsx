"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { initialQuestions } from "@/components/questions/question-data";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const question = useMemo(() => initialQuestions.find((q) => q.id === params.id), [params.id]);
  const [saved, setSaved] = useState(Boolean(question?.viewerState.saved));
  const [voted, setVoted] = useState(Boolean(question?.viewerState.voted));
  const [draft, setDraft] = useState("");
  if (!question) return <section className="mx-auto max-w-[1540px] px-4 py-6"><p>No encontramos esta pregunta.</p><Link href="/app/preguntas" className="mt-2 inline-block text-indigo-600">Volver a Preguntas</Link></section>;
  const related = initialQuestions.filter((q) => q.course === question.course && q.id !== question.id).slice(0, 4);
  return <section className="mx-auto grid max-w-[1540px] gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[1fr_320px]"><article className="rounded-2xl border bg-white p-5"><Link className="text-indigo-600" href="/app/preguntas">Volver a Preguntas</Link><h1 className="mt-2 text-2xl font-black">{question.title}</h1><p className="mt-2 text-slate-700">{question.description}</p><p className="mt-2 text-xs text-slate-500">{question.authorName} · {question.course} · {new Date(question.createdAt).toLocaleDateString("es-PE")}</p><div className="mt-2 flex flex-wrap gap-1">{question.tags.map((t)=><span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">#{t}</span>)}</div>
  <div className="mt-3 flex flex-wrap gap-2">{question.images?.map((img)=><img key={img.id} src={img.url} alt={img.alt??"Adjunto"} className="h-24 w-24 rounded object-cover" loading="lazy" />)}</div>
  <div className="mt-3 space-y-2">{question.files?.map((f)=><div key={f.id} className="rounded border p-2 text-xs">{f.name} · {Math.round(f.size/1024)} KB · {f.type}</div>)}</div>
  <p className="mt-3 text-sm">{question.stats.votes} votos · {question.stats.saves} guardados</p>
  <div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>setVoted((v)=>!v)} className="rounded border px-3 py-1 text-sm">{voted?"Quitar voto":"Votar"}</button><button onClick={()=>setSaved((v)=>!v)} className="rounded border px-3 py-1 text-sm">{saved?"Guardada":"Guardar"}</button><button onClick={async ()=>navigator.clipboard.writeText(`${window.location.origin}/app/preguntas/${question.id}`)} className="rounded border px-3 py-1 text-sm">Compartir</button></div>
  {question.bestAnswer?<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="font-semibold">Mejor respuesta destacada</p><p className="text-sm">{question.bestAnswer.content}</p></div>:null}
  <h2 className="mt-4 text-lg font-bold">Respuestas</h2><div className="space-y-2">{(question.answersPreview??[]).map((a)=><div key={a.id} className="rounded-xl border p-3"><p className="text-xs text-slate-500">{a.authorName} · {new Date(a.createdAt).toLocaleDateString("es-PE")}</p><p className="text-sm">{a.content}</p>{question.viewerState.isMine?<button className="mt-2 text-xs text-indigo-700">Marcar como mejor respuesta</button>:null}</div>)}</div>
  <div className="mt-4 rounded-xl border p-3"><p className="font-semibold">Responder</p><textarea className="mt-2 w-full rounded border p-2" value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Escribe tu respuesta completa" /><button className="mt-2 rounded bg-indigo-600 px-3 py-1 text-white">Publicar respuesta</button></div>
  </article><aside className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Preguntas relacionadas</h3><div className="mt-2 space-y-2">{related.map((q)=><Link key={q.id} className="block text-sm text-indigo-600" href={`/app/preguntas/${q.id}`}>{q.title}</Link>)}</div></aside></section>;
}
