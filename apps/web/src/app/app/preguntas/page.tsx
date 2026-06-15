"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFilters } from "@/components/questions/QuestionFilters";
import { QuestionsHeader } from "@/components/questions/QuestionsHeader";
import { GoodQuestionTipsCard, QuestionsSidebar } from "@/components/questions/QuestionsSidebar";
import { QUESTION_COURSES } from "@/components/questions/question-data";
import { useQuestions } from "@/hooks/useQuestions";

export default function QuestionsPage() {
  const { questions, stats, toast, notify, save, loading, error, retry, shouldUseMock } = useQuestions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("q")?.trim() ?? "";
  const [filter, setFilter] = useState("Para ti");
  const [course, setCourse] = useState("Todos");
  const filtered = useMemo(() => {
    const list = questions.filter((q) => {
      const matchesSearch = [q.title, q.description, q.course, q.authorName, q.tags.join(" "), (q.files ?? []).map((f) => f.name).join(" ")].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesCourse = course === "Todos" || q.course === course;
      return matchesSearch && matchesCourse;
    });
    if (filter === "Sin responder") return list.filter((q) => q.stats.answers === 0);
    if (filter === "Respondidas") return list.filter((q) => q.stats.answers > 0);
    if (filter === "Resueltas") return list.filter((q) => Boolean(q.bestAnswer || q.status === "resuelta"));
    if (filter === "Mis preguntas") return list.filter((q) => q.viewerState.isMine);
    if (filter === "Más recientes") return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (filter === "Más votadas") return [...list].sort((a, b) => b.stats.votes - a.stats.votes);
    return list;
  }, [questions, search, course, filter]);

  if (loading) return <section className="mx-auto max-w-[1540px] space-y-4 px-4 sm:px-6 lg:px-8"><div className="h-24 animate-pulse rounded-2xl bg-slate-100" /><div className="grid gap-4 xl:grid-cols-[1fr_320px]"><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-slate-100" /></div></section>;
  if (error && error !== "request_failed") return <section className="mx-auto max-w-[1540px] px-4 py-6"><p className="mb-2 text-red-600">No pudimos cargar las preguntas.</p><button className="rounded border px-3 py-2" onClick={retry}>Reintentar</button></section>;

  return <section className="mx-auto max-w-[1540px] space-y-4 px-4 sm:px-6 lg:px-8"><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-4"><QuestionsHeader stats={stats} onAsk={() => router.push("/app/preguntas/nuevo")} onUnanswered={() => setFilter("Sin responder")} />{shouldUseMock ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Modo demo: el backend no devolvió preguntas reales todavía.</p> : null}<QuestionFilters active={filter} onChange={(value)=>{ if (value === "Mis preguntas" && !questions.some((q) => q.viewerState.isMine)) return notify("Inicia sesión para ver tus preguntas.", "info"); setFilter(value); }} course={course} onCourseChange={setCourse} courses={QUESTION_COURSES} /><div className="space-y-3">{filtered.length===0?<div className="rounded-2xl border bg-white p-4">No encontramos preguntas con ese término. <button className="ml-2 text-indigo-600" onClick={()=>router.push("/app/preguntas/nuevo")}>Hacer una pregunta sobre este tema</button></div>:filtered.map((q)=><QuestionCard key={q.id} question={q} onSave={()=>save(q.id)} onShare={()=>{navigator.clipboard.writeText(`${window.location.origin}/app/preguntas/${q.id}`); notify("Enlace de pregunta copiado.","success");}} onRespond={()=>router.push(`/app/preguntas/${q.id}`)} onToggleAnswers={()=>router.push(`/app/preguntas/${q.id}`)} />)}</div></div><aside className="space-y-4"><GoodQuestionTipsCard onInfo={(m)=>notify(m,"info")} /><QuestionsSidebar questions={questions} onFeatured={(id)=>router.push(`/app/preguntas/${id}`)} onCourse={setCourse} onUnanswered={()=>setFilter("Sin responder")} /></aside></div>{toast?<div className="fixed bottom-4 right-4 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{toast.message}</div>:null}</section>;
}
