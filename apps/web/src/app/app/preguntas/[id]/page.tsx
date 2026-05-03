"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createAnswer, getQuestionById } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";
import { PageState } from "@/components/ui";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAccessToken();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState("");
  const [bestAnswerId, setBestAnswerId] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<number, number>>({});

  async function loadQuestion() {
    try {
      setError(null);
      const data = await getQuestionById(Number(params.id));
      setQuestion(data);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar la pregunta."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQuestion();
  }, [params.id]);

  const sortedAnswers = useMemo(() => {
    if (!question?.answers) return [];
    return [...question.answers].sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0));
  }, [question, votes]);

  async function submitAnswer() {
    if (!answerContent.trim()) return;
    await createAnswer(question.id, answerContent.trim(), accessToken ?? "");
    setAnswerContent("");
    await loadQuestion();
  }

  if (loading) return <PageState type="loading" title="Cargando pregunta" description="Preparando el detalle de la tarea." />;
  if (error || !question) return <PageState type="error" title="No pudimos abrir la pregunta" description={error ?? "Pregunta no encontrada."} />;

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black">{question.title}</h1>
        <p className="mt-3 whitespace-pre-line text-slate-700">{question.content}</p>
      </article>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Respuestas ({sortedAnswers.length})</h2>
        <div className="mt-4 space-y-3">
          {sortedAnswers.map((answer: any) => {
            const score = votes[answer.id] ?? 0;
            const isBest = bestAnswerId === answer.id;
            return (
              <div key={answer.id} className={`rounded-xl border p-3 ${isBest ? "border-emerald-300 bg-emerald-50" : "border-slate-200"}`}>
                <p className="text-sm text-slate-800">{answer.content}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="rounded-full border border-slate-300 px-2 py-1 text-xs" onClick={() => setVotes((prev) => ({ ...prev, [answer.id]: score + 1 }))}>▲ A favor</button>
                  <button type="button" className="rounded-full border border-slate-300 px-2 py-1 text-xs" onClick={() => setVotes((prev) => ({ ...prev, [answer.id]: score - 1 }))}>▼ En contra</button>
                  <span className="text-xs text-slate-500">Puntaje: {score}</span>
                  <button type="button" className="rounded-full border border-emerald-300 px-2 py-1 text-xs text-emerald-700" onClick={() => setBestAnswerId(answer.id)}>{isBest ? "Respuesta elegida" : "Elegir como respuesta adecuada"}</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <input className="flex-1 rounded-xl border border-slate-300 px-4 py-2" placeholder="Escribe una explicación o procedimiento" value={answerContent} onChange={(e) => setAnswerContent(e.target.value)} />
          <button onClick={() => void submitAnswer()} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Responder</button>
        </div>
      </section>
    </section>
  );
}
