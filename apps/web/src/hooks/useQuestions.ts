import { useMemo, useState } from "react";
import { initialQuestions } from "@/components/questions/question-data";
import type { QuestionItem } from "@/components/questions/types";

export function useQuestions() {
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const stats = useMemo(() => ({ active: questions.length, answers: questions.reduce((s, q) => s + q.stats.answers, 0), solved: questions.filter((q) => q.bestAnswer || q.status === "resuelta").length }), [questions]);
  const notify = (message: string, type: "success" | "error" | "info" = "info") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  function addQuestion(payload: Pick<QuestionItem, "title" | "description" | "course" | "tags" | "images" | "files">) {
    const next: QuestionItem = { id: `q${Date.now()}`, title: payload.title, description: payload.description, course: payload.course, tags: payload.tags, images: payload.images, files: payload.files, createdAt: new Date().toISOString(), authorName: "Tú", status: "sin_responder", stats: { answers: 0, votes: 0, views: 0, saves: 0 }, viewerState: { voted: false, saved: false, isMine: true } };
    setQuestions((prev) => [next, ...prev]);
    notify("Pregunta publicada correctamente.", "success");
  }
  const vote = (id: string) => setQuestions((prev) => prev.map((q) => q.id !== id ? q : ({ ...q, viewerState: { ...q.viewerState, voted: !q.viewerState.voted }, stats: { ...q.stats, votes: q.stats.votes + (q.viewerState.voted ? -1 : 1) } })));
  const save = (id: string) => setQuestions((prev) => prev.map((q) => q.id !== id ? q : ({ ...q, viewerState: { ...q.viewerState, saved: !q.viewerState.saved }, stats: { ...q.stats, saves: q.stats.saves + (q.viewerState.saved ? -1 : 1) } })));
  const addAnswer = (id: string, content: string) => { if (!content.trim()) return notify("La respuesta no puede estar vacía.", "error"); setQuestions((prev) => prev.map((q) => q.id !== id ? q : ({ ...q, status: q.status === "sin_responder" ? "respondida" : q.status, stats: { ...q.stats, answers: q.stats.answers + 1 }, answersPreview: [{ id: `a${Date.now()}`, authorName: "Tú", content, votes: 0, createdAt: new Date().toISOString() }, ...(q.answersPreview ?? [])] }))); notify("Respuesta publicada.", "success"); };
  return { questions, setQuestions, stats, toast, notify, addQuestion, vote, save, addAnswer, expanded, setExpanded };
}
