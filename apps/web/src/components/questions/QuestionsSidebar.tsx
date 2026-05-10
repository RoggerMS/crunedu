import type { QuestionItem } from "./types";
export function QuestionsSidebar({ questions, onFeatured, onCourse, onUnanswered }: { questions: QuestionItem[]; onFeatured: (id: string) => void; onCourse: (c: string) => void; onUnanswered: () => void }) {
  return <div className="space-y-3"><FeaturedQuestionsCard questions={questions} onFeatured={onFeatured} /><CoursesWithQuestionsCard onCourse={onCourse} /><TopContributorsCard /><UnansweredQuestionsCard onUnanswered={onUnanswered} /></div>;
}

export function GoodQuestionTipsCard({ onInfo }: { onInfo: (m: string) => void }) {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Cómo hacer una buena pregunta</h3><ul className="mt-2 list-decimal pl-4 text-sm text-slate-600"><li>Sé claro y específico.</li><li>Incluye contexto.</li><li>Muestra qué intentaste.</li><li>Agrega datos o fórmulas clave.</li><li>Usa un título concreto.</li></ul><button onClick={() => onInfo("Guía disponible próximamente.")} className="mt-2 text-sm font-semibold text-indigo-600">Ver guía completa</button></div>;
}

function FeaturedQuestionsCard({ questions, onFeatured }: { questions: QuestionItem[]; onFeatured: (id: string) => void }) {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Preguntas destacadas</h3>{questions.slice(0, 3).map((q) => <button key={q.id} className="mt-2 block text-left text-sm text-indigo-700" onClick={() => onFeatured(q.id)}>{q.title}</button>)}</div>;
}

function CoursesWithQuestionsCard({ onCourse }: { onCourse: (c: string) => void }) {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Cursos con más dudas</h3><div className="mt-2 flex flex-wrap gap-1">{["Matemática", "Estadística", "Programación", "Física", "Inglés"].map((c) => <button key={c} onClick={() => onCourse(c)} className="rounded bg-slate-100 px-2 py-1 text-xs">{c}</button>)}</div></div>;
}

function TopContributorsCard() {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Top colaboradores</h3><ul className="mt-2 space-y-1 text-sm text-slate-600"><li>Ana · 24 respuestas</li><li>Carlos · 19 respuestas</li><li>María · 16 respuestas</li></ul></div>;
}

function UnansweredQuestionsCard({ onUnanswered }: { onUnanswered: () => void }) {
  return <div className="rounded-2xl border bg-white p-4"><h3 className="font-bold">Sin responder</h3><button onClick={onUnanswered} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm">Responder ahora</button></div>;
}
