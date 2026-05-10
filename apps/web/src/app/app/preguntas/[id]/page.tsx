"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { initialQuestions } from "@/components/questions/question-data";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const question = initialQuestions.find((q) => q.id === params.id);
  const [saved, setSaved] = useState(Boolean(question?.viewerState.saved));
  if (!question) return <section className="mx-auto max-w-[1540px] px-4 py-6">No encontramos esta pregunta.</section>;
  return <section className="mx-auto grid max-w-[1540px] gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[1fr_320px]"><article className="rounded-2xl border bg-white p-5"><div className="mb-3 flex gap-2"><Link className="text-indigo-600" href="/app/preguntas">Volver a preguntas</Link><button className="text-sm" onClick={async ()=>{await navigator.clipboard.writeText(`${window.location.origin}/app/preguntas/${question.id}`);}}>Compartir</button><button className="text-sm" onClick={()=>setSaved((v)=>!v)}>{saved?"Guardada":"Guardar"}</button></div><h1 className="text-2xl font-black">{question.title}</h1><p className="mt-2 text-slate-600">{question.description}</p><p className="mt-2 text-xs text-slate-500">{question.course} · {question.authorName}</p><div className="mt-3 flex gap-2">{question.images?.map((img)=><img key={img.id} src={img.url} alt={img.alt??"Adjunto"} className="h-24 w-24 rounded object-cover" loading="lazy" />)}</div>{question.files?.map((f)=><div key={f.id} className="mt-3 rounded border p-2 text-xs">{f.name} · {Math.round(f.size/1024)} KB</div>)}<div className="mt-4 space-y-2">{(question.answersPreview ?? []).map((a) => <div key={a.id} className="rounded-xl border p-3"><p className="text-sm">{a.content}</p></div>)}</div></article><aside className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Más preguntas del curso</h3><div className="mt-2 space-y-2">{initialQuestions.filter((q) => q.course === question.course && q.id !== question.id).slice(0,4).map((q) => <Link key={q.id} className="block text-sm text-indigo-600" href={`/app/preguntas/${q.id}`}>{q.title}</Link>)}</div></aside></section>;
}
