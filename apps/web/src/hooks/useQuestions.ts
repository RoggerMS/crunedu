import { useEffect, useMemo, useState } from "react";
import { initialQuestions } from "@/components/questions/question-data";
import type { QuestionItem } from "@/components/questions/types";
import { apiRequest, createAnswer, createQuestion, mapApiError } from "@/lib/api-helpers";

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

function mapQuestion(question: ApiQuestion): QuestionItem {
  return {
    id: String(question.id),
    title: question.title,
    description: question.content,
    course: question.community?.name ?? "General",
    authorName: authorName(question.author),
    createdAt: question.createdAt,
    status: question.isResolved ? "resuelta" : question.answersCount > 0 ? "respondida" : "sin_responder",
    tags: question.community?.name ? [question.community.name] : [],
    stats: { answers: question.answersCount, votes: 0, views: 0, saves: 0 },
    viewerState: { voted: false, saved: false },
    answersPreview: question.answers.map((answer) => ({
      id: String(answer.id),
      authorName: authorName(answer.author),
      content: answer.content,
      votes: 0,
      createdAt: answer.createdAt,
    })),
  };
}

async function fetchQuestions(): Promise<QuestionItem[]> {
  const data = await apiRequest<{ items: ApiQuestion[]; nextCursor: number | null }>("/questions");
  return (data.items ?? []).map(mapQuestion);
}


export function useQuestions() {
  const [realQuestions, setRealQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchQuestions()
      .then((data) => {
        if (!mounted) return;
        setRealQuestions(data);
        setError(null);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setRealQuestions([]);
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const shouldUseMock = process.env.NODE_ENV === "development" && realQuestions.length === 0 && !loading && !error;
  // Fallback local only: used when backend endpoint is not available yet in development.
  const [localQuestions, setLocalQuestions] = useState<QuestionItem[]>(initialQuestions);
  const questions = shouldUseMock ? localQuestions : realQuestions;

  const stats = useMemo(() => ({ active: questions.length, answers: questions.reduce((s, q) => s + q.stats.answers, 0), solved: questions.filter((q) => q.bestAnswer || q.status === "resuelta").length }), [questions]);
  const notify = (message: string, type: "success" | "error" | "info" = "info") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  async function addQuestion(payload: Pick<QuestionItem, "title" | "description" | "course" | "tags" | "images" | "files">) {
    if (!payload.title.trim() || !payload.description.trim() || !payload.course) { notify("Completa curso, título y descripción.", "error"); return; }
    try {
      const created = await createQuestion({ title: payload.title.trim(), content: payload.description.trim() }, "");
      setRealQuestions((prev) => [mapQuestion(created as ApiQuestion), ...prev]);
      notify("Pregunta publicada correctamente.", "success");
    } catch (error) {
      notify(mapApiError(error, "No se pudo publicar la pregunta."), "error");
    }
  }
  const updater = (id: string, fn: (q: QuestionItem) => QuestionItem) => {
    if (shouldUseMock) setLocalQuestions((prev) => prev.map((q) => q.id !== id ? q : fn(q)));
    else setRealQuestions((prev) => prev.map((q) => q.id !== id ? q : fn(q)));
  };
  const vote = (id: string) => updater(id, (q) => ({ ...q, viewerState: { ...q.viewerState, voted: !q.viewerState.voted }, stats: { ...q.stats, votes: q.stats.votes + (q.viewerState.voted ? -1 : 1) } }));
  const save = (id: string) => updater(id, (q) => ({ ...q, viewerState: { ...q.viewerState, saved: !q.viewerState.saved }, stats: { ...q.stats, saves: q.stats.saves + (q.viewerState.saved ? -1 : 1) } }));
  const addAnswer = async (id: string, content: string) => {
    if (!content.trim()) return notify("La respuesta no puede estar vacía.", "error");
    try {
      const answer = await createAnswer(Number(id), content.trim(), "") as { id: number; content: string; createdAt: string; author: ApiQuestion["author"] };
      updater(id, (q) => ({ ...q, status: q.status === "sin_responder" ? "respondida" : q.status, stats: { ...q.stats, answers: q.stats.answers + 1 }, answersPreview: [{ id: String(answer.id), authorName: authorName(answer.author), content: answer.content, votes: 0, createdAt: answer.createdAt }, ...(q.answersPreview ?? [])] }));
      notify("Respuesta publicada.", "success");
    } catch (error) {
      notify(mapApiError(error, "No se pudo publicar la respuesta."), "error");
    }
  };
  const saveDraft = (payload: Pick<QuestionItem, "title" | "description" | "course" | "tags" | "images" | "files">) => {
    const has = Boolean(payload.title.trim() || payload.description.trim() || payload.tags.length || payload.course || payload.images?.length || payload.files?.length);
    if (!has) return notify("No hay contenido para guardar.", "info");
    const current = JSON.parse(localStorage.getItem("crunedu_question_drafts") ?? "[]");
    current.unshift({ ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem("crunedu_question_drafts", JSON.stringify(current.slice(0, 20)));
    notify("Borrador guardado.", "success");
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchQuestions().then(setRealQuestions).catch((err: Error) => setError(err.message)).finally(() => setLoading(false));
  };

  return { questions, stats, toast, notify, addQuestion, vote, save, addAnswer, expanded, setExpanded, saveDraft, loading, error, retry, shouldUseMock };
}
