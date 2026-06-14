"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createAnswer, getQuestionById, markAnswerUseful, mapApiError } from "@/lib/api-helpers";
import { buildApiUrl } from "@/lib/http-client";
import { useAccessToken } from "@/hooks/useAccessToken";
import { buildLoginHref } from "@/lib/auth-routes";

type ApiQuestion = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isResolved: boolean;
  author: { firstName: string | null; lastName: string | null; email: string };
  community?: { id: number; name: string } | null;
  images?: Array<{ id: number; imageUrl: string; mimeType: string; sizeBytes: number; position: number }>;
  answersCount: number;
  answers: Array<{ id: number; content: string; createdAt: string; isUseful?: boolean; author: { firstName: string | null; lastName: string | null; email: string } }>;
};

function authorName(author: ApiQuestion["author"]) {
  return [author.firstName, author.lastName].filter(Boolean).join(" ") || author.email || "Estudiante CrunEdu";
}

function imageSrc(imageUrl: string) {
  return buildApiUrl(imageUrl.replace(/^\/api/, ""));
}

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken, isAuthenticated } = useAccessToken();
  const questionId = useMemo(() => Number(params.id), [params.id]);
  const [question, setQuestion] = useState<ApiQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loginHref = buildLoginHref(`/app/preguntas/${params.id}`);

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
    return () => { mounted = false; };
  }, [questionId]);

  async function submitAnswer() {
    if (!question || !draft.trim()) return;
    if (!isAuthenticated) return setError("Inicia sesión para responder.");
    setSubmitting(true);
    try {
      const answer = (await createAnswer(question.id, draft.trim(), accessToken ?? "")) as ApiQuestion["answers"][number];
      setQuestion({ ...question, answers: [...question.answers, answer], answersCount: question.answersCount + 1 });
      setDraft("");
      setError(null);
    } catch (err) {
      setError(mapApiError(err, "No se pudo publicar la respuesta."));
    } finally {
      setSubmitting(false);
    }
  }

  async function markUseful(answerId: number) {
    if (!question) return;
    if (!isAuthenticated) return setError("Inicia sesión para marcar una respuesta como útil.");
    try {
      await markAnswerUseful(question.id, answerId, accessToken ?? "");
      setQuestion({ ...question, isResolved: true, answers: question.answers.map((answer) => ({ ...answer, isUseful: answer.id === answerId })) });
      setError(null);
    } catch (err) {
      setError(mapApiError(err, "No se pudo marcar la respuesta."));
    }
  }

  if (loading) return <section className="mx-auto max-w-[1540px] px-4 py-6"><p>Cargando pregunta...</p></section>;
  if (!question) return <section className="mx-auto max-w-[1540px] px-4 py-6"><p>{error ?? "No encontramos esta pregunta."}</p><Link href="/app/preguntas" className="mt-2 inline-block text-indigo-600">Volver a Preguntas</Link></section>;

  return <section className="mx-auto grid max-w-[1540px] gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[1fr_320px]">
    <main className="space-y-4">
      <article className="rounded-2xl border bg-white p-5">
        <Link className="text-sm font-semibold text-indigo-700" href="/app/preguntas">← Volver a Preguntas</Link>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{authorName(question.author)}</span><span>•</span><span>{new Date(question.createdAt).toLocaleDateString("es-PE")}</span><span>•</span><span>{question.community?.name ?? "General"}</span></div>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{question.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">{question.content}</p>
        {question.images?.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{question.images.map((image) => <a key={image.id} href={imageSrc(image.imageUrl)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border bg-slate-50"><img src={imageSrc(image.imageUrl)} alt="Imagen adjunta de la pregunta" className="max-h-[420px] w-full object-contain" /></a>)}</div> : null}
        <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{question.isResolved ? "Resuelta" : question.answersCount > 0 ? "Con respuestas" : "Abierta"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{question.answersCount} respuestas</span></div>
      </article>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">Respuestas</h2>
        <div className="mt-3 space-y-3">{question.answers.length ? question.answers.map((answer) => <article key={answer.id} className={`rounded-xl border p-4 ${answer.isUseful ? "border-emerald-200 bg-emerald-50" : "bg-white"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{authorName(answer.author)} · {new Date(answer.createdAt).toLocaleDateString("es-PE")}</p>{answer.isUseful ? <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Útil / correcta</span> : null}</div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{answer.content}</p><button onClick={() => void markUseful(answer.id)} className="mt-3 rounded-lg border px-3 py-1 text-xs font-semibold text-slate-700">Marcar como útil/correcta</button></article>) : <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">Sé la primera persona en responder con una explicación clara.</p>}</div>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Responder</h2>
        {!isAuthenticated ? <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Necesitas iniciar sesión para responder. <Link href={loginHref} className="font-bold text-indigo-700 underline">Iniciar sesión</Link></p> : null}
        <textarea className="mt-3 min-h-36 w-full rounded-xl border p-3" value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder="Escribe una explicación paso a paso. Puedes debatir si una respuesta anterior está incompleta o proponer otro método." />
        {error ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <button disabled={submitting || !draft.trim() || !isAuthenticated} onClick={() => void submitAnswer()} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:bg-slate-300">{submitting ? "Publicando..." : "Publicar respuesta"}</button>
      </section>
    </main>
    <aside className="h-fit rounded-2xl border bg-white p-4"><h3 className="font-bold">Cómo ayudar mejor</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600"><li>Explica el procedimiento, no solo el resultado.</li><li>Si una respuesta tiene un error, responde con respeto y corrige el paso.</li><li>Marca como útil la respuesta más clara cuando corresponda.</li></ul></aside>
  </section>;
}
