import { QUESTION_COURSES } from "./question-data";
import type { QuestionItem } from "./types";

type Collaborator = { name: string; usefulCount: number; answerCount: number };

function computeRanking(questions: QuestionItem[]): Collaborator[] {
  const map = new Map<string, Collaborator>();
  for (const question of questions) {
    for (const answer of question.answersPreview ?? []) {
      const existing = map.get(answer.authorName) ?? { name: answer.authorName, usefulCount: 0, answerCount: 0 };
      existing.answerCount += 1;
      if (answer.isBest) existing.usefulCount += 1;
      map.set(answer.authorName, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.usefulCount - a.usefulCount || b.answerCount - a.answerCount).slice(0, 5);
}

export function QuestionSubjectsRail({ course, onCourse }: { course: string; onCourse: (c: string) => void }) {
  const subjects = ["Todas", ...QUESTION_COURSES];
  return (
    <nav className="rounded-2xl border border-slate-200 bg-white p-3" aria-label="Asignaturas">
      <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Asignaturas</h2>
      <ul className="space-y-0.5">
        {subjects.map((subject) => {
          const isActive = (course === "Todos" && subject === "Todas") || course === subject;
          return (
            <li key={subject}>
              <button
                type="button"
                onClick={() => onCourse(subject === "Todas" ? "Todos" : subject)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {subject}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function UserQuestionSummaryCard({ userName, questionsCount }: { userName: string; questionsCount: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{userName.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{questionsCount} {questionsCount === 1 ? "pregunta publicada" : "preguntas publicadas"}</p>
        </div>
      </div>
    </div>
  );
}

export function CollaboratorRankingCard({ questions }: { questions: QuestionItem[] }) {
  const ranking = computeRanking(questions);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-900">Colaboradores destacados</h3>
      <p className="mt-1 text-xs text-slate-500">Por respuestas marcadas como correctas.</p>
      {ranking.length ? (
        <ol className="mt-3 space-y-2">
          {ranking.map((collaborator, index) => (
            <li key={collaborator.name} className="flex items-center gap-3 text-sm">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{collaborator.name}</span>
              <span className="text-xs font-semibold text-emerald-600">{collaborator.usefulCount} útiles</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Aún no hay colaboradores. ¡Responde una pregunta y aparece aquí!</p>
      )}
    </div>
  );
}

export function QuestionsSidebar({ questions, onFeatured, onCourse, onUnanswered }: { questions: QuestionItem[]; onFeatured: (id: string) => void; onCourse: (c: string) => void; onUnanswered: () => void }) {
  const unansweredCount = questions.filter((question) => question.stats.answers === 0).length;
  return (
    <div className="space-y-3">
      <FeaturedQuestionsCard questions={questions} onFeatured={onFeatured} />
      <CoursesWithQuestionsCard questions={questions} onCourse={onCourse} />
      <UnansweredQuestionsCard count={unansweredCount} onUnanswered={onUnanswered} />
    </div>
  );
}

export function GoodQuestionTipsCard({ onInfo: _onInfo }: { onInfo: (m: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-900">Cómo hacer una buena pregunta</h3>
      <ul className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-slate-600">
        <li>Sé claro y específico en el título.</li>
        <li>Incluye el contexto y el enunciado completo.</li>
        <li>Muestra qué intentaste y dónde te quedaste.</li>
        <li>Agrega imágenes nítidas si el ejercicio lo necesita.</li>
      </ul>
    </div>
  );
}

function FeaturedQuestionsCard({ questions, onFeatured }: { questions: QuestionItem[]; onFeatured: (id: string) => void }) {
  const featured = questions.filter((question) => question.stats.answers > 0 || question.bestAnswer).slice(0, 3);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-900">Preguntas destacadas</h3>
      {featured.length ? featured.map((q) => <button key={q.id} className="mt-2 block text-left text-sm font-medium text-indigo-700 hover:underline" onClick={() => onFeatured(q.id)}>{q.title}</button>) : <p className="mt-2 text-sm text-slate-500">Aún no hay preguntas destacadas.</p>}
    </div>
  );
}

function CoursesWithQuestionsCard({ questions, onCourse }: { questions: QuestionItem[]; onCourse: (c: string) => void }) {
  const courses = [...new Set(questions.map((question) => question.course).filter(Boolean))].slice(0, 6);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-900">Cursos con dudas</h3>
      <div className="mt-2 flex flex-wrap gap-1">
        {courses.length ? courses.map((c) => <button key={c} onClick={() => onCourse(c)} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200">{c}</button>) : <span className="text-sm text-slate-500">Sin cursos por ahora.</span>}
      </div>
    </div>
  );
}

function UnansweredQuestionsCard({ count, onUnanswered }: { count: number; onUnanswered: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-900">Sin responder</h3>
      <p className="mt-1 text-sm text-slate-600">{count ? `${count} preguntas esperan ayuda.` : "No hay preguntas sin responder en este filtro."}</p>
      <button onClick={onUnanswered} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Ver preguntas sin responder</button>
    </div>
  );
}
