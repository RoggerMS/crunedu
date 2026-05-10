import type { QuestionItem } from "./types";
export function QuestionAnswersPanel({ question, onBest }: { question: QuestionItem; onBest: (id: string) => void }) {
  const answers = question.answersPreview ?? (question.bestAnswer ? [question.bestAnswer] : []);
  return <div className="mt-2 rounded-xl border bg-slate-50 p-3">{answers.length===0?<p className="text-sm text-slate-500">Aún no hay respuestas.</p>:answers.map((a)=><div key={a.id} className="mb-2 rounded-lg bg-white p-2 text-sm"><p>{a.content}</p><button onClick={()=>onBest(a.id)} className="mt-1 text-xs text-indigo-600">Marcar como mejor respuesta</button></div>)}</div>;
}
