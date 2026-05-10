"use client";
import { useMemo, useState } from "react";
import { CreateQuestionModal } from "@/components/questions/CreateQuestionModal";
import { AnswerQuestionModal } from "@/components/questions/AnswerQuestionModal";
import { QuestionAnswersPanel } from "@/components/questions/QuestionAnswersPanel";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFilters } from "@/components/questions/QuestionFilters";
import { QuestionsHeader } from "@/components/questions/QuestionsHeader";
import { QuestionSearch } from "@/components/questions/QuestionSearch";
import { QuestionsSidebar } from "@/components/questions/QuestionsSidebar";
import { QUESTION_COURSES } from "@/components/questions/question-data";
import { useQuestions } from "@/hooks/useQuestions";

export default function QuestionsPage() {
  const { questions, stats, toast, notify, addQuestion, vote, save, addAnswer, expanded, setExpanded } = useQuestions();
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("Para ti"); const [course, setCourse] = useState("Todos"); const [openCreate, setOpenCreate] = useState(false); const [answerId, setAnswerId] = useState<string | null>(null);
  const filtered = useMemo(() => questions.filter((q) => {
    const matchesSearch = [q.title, q.description, q.course, q.authorName, q.tags.join(" "), (q.files ?? []).map((f) => f.name).join(" ")].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesCourse = course === "Todos" || q.course === course;
    const matchesFilter = filter === "Sin responder" ? q.stats.answers === 0 : filter === "Respondidas" ? q.stats.answers > 0 : filter === "Resueltas" ? Boolean(q.bestAnswer || q.status === "resuelta") : true;
    return matchesSearch && matchesCourse && matchesFilter;
  }), [questions, search, course, filter]);

  return <section className="mx-auto max-w-[1540px] space-y-4 px-4 sm:px-6 lg:px-8"><QuestionsHeader onAsk={() => setOpenCreate(true)} onUnanswered={() => setFilter("Sin responder")} /><div className="rounded-2xl border bg-white p-3"><QuestionSearch value={search} onChange={setSearch} /></div><div className="rounded-2xl border bg-white p-3 text-sm">{stats.active} Preguntas activas · {stats.answers} Respuestas · {stats.solved} Preguntas resueltas</div><QuestionFilters active={filter} onChange={setFilter} course={course} onCourseChange={setCourse} courses={QUESTION_COURSES} /><div className="grid gap-4 xl:grid-cols-[1fr_320px]"><div className="space-y-3">{filtered.length===0?<div className="rounded-2xl border bg-white p-4">No encontramos preguntas con ese término. <button className="ml-2 text-indigo-600" onClick={()=>setOpenCreate(true)}>Hacer una pregunta sobre este tema</button></div>:filtered.map((q)=><div key={q.id}><QuestionCard question={q} onVote={()=>vote(q.id)} onSave={()=>{save(q.id); notify(q.viewerState.saved?"Pregunta quitada de guardados.":"Pregunta guardada.","success");}} onShare={()=>{navigator.clipboard.writeText(`${window.location.origin}/app/preguntas/${q.id}`); notify("Enlace de pregunta copiado.","success");}} onRespond={()=>setAnswerId(q.id)} onToggleAnswers={()=>setExpanded(expanded===q.id?null:q.id)} />{expanded===q.id?<QuestionAnswersPanel question={q} onBest={()=>notify("Marcaste una mejor respuesta.","success")} />:null}</div>)}</div><QuestionsSidebar questions={questions} onCourse={setCourse} onUnanswered={()=>setFilter("Sin responder")} onInfo={(m)=>notify(m,"info")} /></div>{toast?<div className="fixed bottom-4 right-4 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{toast.message}</div>:null}<CreateQuestionModal open={openCreate} onClose={()=>setOpenCreate(false)} onSubmit={(v)=>{addQuestion(v); setOpenCreate(false);}} /><AnswerQuestionModal open={Boolean(answerId)} onClose={()=>setAnswerId(null)} onSubmit={(content)=>{if(answerId) addAnswer(answerId, content); setAnswerId(null);}} /></section>;
}
