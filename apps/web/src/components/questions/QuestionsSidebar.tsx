import type { QuestionItem } from "./types";

export function QuestionsSidebar({ questions, onFeatured, onCourse, onUnanswered }: { questions: QuestionItem[]; onFeatured: (id: string) => void; onCourse: (c: string) => void; onUnanswered: () => void }) {
  const unansweredCount = questions.filter((question) => question.stats.answers === 0).length;
  return <div className="space-y-3"><FeaturedQuestionsCard questions={questions} onFeatured={onFeatured} /><CoursesWithQuestionsCard questions={questions} onCourse={onCourse} /><UnansweredQuestionsCard count={unansweredCount} onUnanswered={onUnanswered} /></div>;
}

export function GoodQuestionTipsCard({ onInfo: _onInfo }: { onInfo: (m: string) => void }) {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Cómo hacer una buena pregunta</h3><ul className="mt-2 list-decimal pl-4 text-sm text-slate-600"><li>Sé claro y específico.</li><li>Incluye contexto y el enunciado completo.</li><li>Muestra qué intentaste y dónde te quedaste.</li><li>Agrega imágenes nítidas si el ejercicio lo necesita.</li></ul></div>;
}

function FeaturedQuestionsCard({ questions, onFeatured }: { questions: QuestionItem[]; onFeatured: (id: string) => void }) {
  const featured = questions.filter((question) => question.stats.answers > 0 || question.bestAnswer).slice(0, 3);
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Preguntas destacadas</h3>{featured.length ? featured.map((q) => <button key={q.id} className="mt-2 block text-left text-sm text-indigo-700" onClick={() => onFeatured(q.id)}>{q.title}</button>) : <p className="mt-2 text-sm text-slate-500">Aún no hay preguntas destacadas.</p>}</div>;
}

function CoursesWithQuestionsCard({ questions, onCourse }: { questions: QuestionItem[]; onCourse: (c: string) => void }) {
  const courses = [...new Set(questions.map((question) => question.course).filter(Boolean))].slice(0, 6);
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Cursos con dudas</h3><div className="mt-2 flex flex-wrap gap-1">{courses.length ? courses.map((c) => <button key={c} onClick={() => onCourse(c)} className="rounded bg-slate-100 px-2 py-1 text-xs">{c}</button>) : <span className="text-sm text-slate-500">Sin cursos por ahora.</span>}</div></div>;
}

function UnansweredQuestionsCard({ count, onUnanswered }: { count: number; onUnanswered: () => void }) {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Sin responder</h3><p className="mt-1 text-sm text-slate-600">{count ? `${count} preguntas esperan ayuda.` : "No hay preguntas sin responder en este filtro."}</p><button onClick={onUnanswered} className="mt-3 w-full rounded-lg border px-3 py-2 text-sm font-semibold">Ver preguntas sin responder</button></div>;
}
