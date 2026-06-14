"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createAnswer, getQuestionById, mapApiError } from "@/lib/api-helpers";

type ApiQuestion = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isResolved: boolean;
  author: { firstName: string | null; lastName: string | null; email: string };
  community?: { id: number; name: string } | null;
  answersCount: number;
  answers: Array<{ id: number; content: string; createdAt: string; author: { firstName: string | null; lastName: string | null; email: string } }>;
};

function authorName(author: ApiQuestion["author"]) {
  return [author.firstName, author.lastName].filter(Boolean).join(" ") || author.email || "Estudiante CrunEdu";
}

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const questionId = useMemo(() => Number(params.id), [params.id]);
  const [question, setQuestion] = useState<ApiQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [voted, setVoted] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!Number.isInteger(questionId) || questionId < 1) {
      setError("Pregunta inválida.");
      setLoading(false);
      return;
    }
    setLoading(true);
    getQuestionById(questionId)
      .then((data) => {
        if (!mounted) return;
        setQuestion(data as ApiQuestion);
        setError(null);
      })
      .catch((err) => mounted && setError(mapApiError(err, "No se pudo cargar la pregunta.")))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [questionId]);

  async function submitAnswer() {
    if (!question || !draft.trim()) return;
    setSubmitting(true);
    try {
      const answer = (await createAnswer(question.id, draft.trim(), "")) as ApiQuestion["answers"][number];
      setQuestion({ ...question, answers: [...question.answers, answer], answersCount: question.answersCount + 1 });
      setDraft("");
    } catch (err) {
      setError(mapApiError(err, "No se pudo publicar la respuesta."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section className="mx-auto max-w-[1540px] px-4 py-6"><p>Cargando pregunta...</p></section>;
  if (error || !question) return <section className="mx-auto max-w-[1540px] px-4 py-6"><p>{error ?? "No encontramos esta pregunta."}</p><Link href="/app/preguntas" className="mt-2 inline-block text-indigo-600">Volver a Preguntas</Link></section>;

  return <section className="mx-auto grid max-w-[1540px] gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[1fr_320px]"><article className="rounded-2xl border bg-white p-5"><Link className="text-indigo-600" href="/app/preguntas">Volver a Preguntas</Link><h1 className="mt-2 text-2xl font-black">{question.title}</h1><p className="mt-2 text-slate-700">{question.content}</p><p className="mt-2 text-xs text-slate-500">{authorName(question.author)} · {question.community?.name ?? "General"} · {new Date(question.createdAt).toLocaleDateString("es-PE")}</p><div className="mt-2 flex flex-wrap gap-1">{question.community?.name ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">#{question.community.name}</span> : null}</div>
  <p className="mt-3 text-sm">{voted ? 1 : 0} votos · {saved ? 1 : 0} guardados · {question.answersCount} respuestas</p>
  <div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>setVoted((v)=>!v)} className="rounded border px-3 py-1 text-sm">{voted?"Quitar voto":"Votar"}</button><button onClick={()=>setSaved((v)=>!v)} className="rounded border px-3 py-1 text-sm">{saved?"Guardada":"Guardar"}</button><button onClick={async ()=>navigator.clipboard.writeText(`${window.location.origin}/app/preguntas/${question.id}`)} className="rounded border px-3 py-1 text-sm">Compartir</button></div>
  <h2 className="mt-4 text-lg font-bold">Respuestas</h2><div className="space-y-2">{question.answers.length ? question.answers.map((a)=><div key={a.id} className="rounded-xl border p-3"><p className="text-xs text-slate-500">{authorName(a.author)} · {new Date(a.createdAt).toLocaleDateString("es-PE")}</p><p className="text-sm">{a.content}</p></div>) : <p className="rounded-xl border border-dashed p-3 text-sm text-slate-500">Sé la primera persona en responder.</p>}</div>
  <div className="mt-4 rounded-xl border p-3"><p className="font-semibold">Responder</p><textarea className="mt-2 w-full rounded border p-2" value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Escribe tu respuesta completa" /><button disabled={submitting || !draft.trim()} onClick={() => void submitAnswer()} className="mt-2 rounded bg-indigo-600 px-3 py-1 text-white disabled:bg-slate-300">Publicar respuesta</button></div>
  </article><aside className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Estado</h3><p className="mt-2 text-sm text-slate-600">{question.isResolved ? "Pregunta resuelta" : question.answersCount > 0 ? "Con respuestas" : "Sin responder"}</p></aside></section>;
}
