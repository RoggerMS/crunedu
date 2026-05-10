"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { initialQuestions } from "@/components/questions/question-data";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const question = initialQuestions.find((q) => q.id === params.id);
  if (!question) return <section className="mx-auto max-w-[1540px] px-4 py-6">Pregunta no encontrada.</section>;
  return <section className="mx-auto grid max-w-[1540px] gap-4 px-4 py-6 xl:grid-cols-[1fr_320px]"><article className="rounded-2xl border bg-white p-5"><h1 className="text-2xl font-black">{question.title}</h1><p className="mt-2 text-slate-600">{question.description}</p><p className="mt-2 text-xs text-slate-500">{question.course} · {question.authorName}</p><div className="mt-4 space-y-2">{(question.answersPreview ?? []).map((a) => <div key={a.id} className="rounded-xl border p-3"><p className="text-sm">{a.content}</p></div>)}</div></article><aside className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Más preguntas del curso</h3><div className="mt-2 space-y-2">{initialQuestions.filter((q) => q.course === question.course && q.id !== question.id).slice(0,4).map((q) => <Link key={q.id} className="block text-sm text-indigo-600" href={`/app/preguntas/${q.id}`}>{q.title}</Link>)}</div></aside></section>;
}
