import { useCallback, useEffect, useMemo, useState } from "react";
import { QUESTION_COURSES } from "@/components/questions/question-data";
import type { QuestionItem } from "@/components/questions/types";
import { apiRequest, createAnswer, createQuestion, mapApiError } from "@/lib/api-helpers";
import { buildApiUrl } from "@/lib/http-client";
import { useAccessToken } from "@/hooks/useAccessToken";

type ApiAuthor = { id?: number; firstName: string | null; lastName: string | null; email: string };

type ApiQuestion = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isResolved: boolean;
  isMine?: boolean;
  author: ApiAuthor;
  community?: { id: number; name: string } | null;
  answersCount: number;
  images?: Array<{ id: number; imageUrl: string; mimeType: string; sizeBytes: number; position: number }>;
  answers: Array<{ id: number; content: string; createdAt: string; isUseful?: boolean; votesScore?: number; upvotes?: number; downvotes?: number; images?: Array<{ id: number; imageUrl: string; mimeType: string; sizeBytes: number; position: number }>; author: ApiAuthor }>;
};

function authorName(author: ApiAuthor) {
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
    images: (question.images ?? []).map((image) => ({ id: String(image.id), url: buildApiUrl(image.imageUrl.replace(/^\/api/, "")), alt: question.title })),
    stats: { answers: question.answersCount, votes: 0, views: 0, saves: 0 },
    viewerState: { voted: false, saved: false, isMine: Boolean(question.isMine) },
    answersPreview: question.answers.map((answer) => ({
      id: String(answer.id),
      authorName: authorName(answer.author),
      content: answer.content,
      votes: 0,
      createdAt: answer.createdAt,
      isBest: Boolean(answer.isUseful),
    })),
  };
}

type FetchOptions = {
  communityId?: number;
  q?: string;
  status?: "open" | "answered" | "resolved";
};

async function fetchQuestions(options?: FetchOptions): Promise<QuestionItem[]> {
  const params = new URLSearchParams();
  if (options?.communityId) params.set("communityId", String(options.communityId));
  if (options?.q) params.set("q", options.q);
  if (options?.status) params.set("status", options.status);
  const qs = params.toString();
  const data = await apiRequest<{ items: ApiQuestion[]; nextCursor: number | null }>(qs ? `/questions?${qs}` : "/questions");
  return (data.items ?? []).map(mapQuestion);
}

export function useQuestions(options?: FetchOptions) {
  const { accessToken } = useAccessToken();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuestions(options);
      setQuestions(data);
    } catch (err: any) {
      setQuestions([]);
      setError(err.message || "No se pudieron cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  }, [options?.communityId, options?.q, options?.status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => ({ active: questions.length, answers: questions.reduce((s, q) => s + q.stats.answers, 0), solved: questions.filter((q) => q.bestAnswer || q.status === "resuelta").length }), [questions]);
  const notify = (message: string, type: "success" | "error" | "info" = "info") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  async function addQuestion(payload: { title: string; content: string; communityId?: number }) {
    if (!payload.title.trim() || !payload.content.trim()) { notify("Completa título y descripción.", "error"); return; }
    if (!accessToken) { notify("Inicia sesión para publicar tu pregunta.", "info"); return; }
    try {
      const created = await createQuestion({ title: payload.title.trim(), content: payload.content.trim(), communityId: payload.communityId }, accessToken);
      setQuestions((prev) => [mapQuestion(created as ApiQuestion), ...prev]);
      notify("Pregunta publicada correctamente.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo publicar la pregunta."), "error");
    }
  }

  const addAnswer = async (id: string, content: string) => {
    if (!content.trim()) return notify("La respuesta no puede estar vacía.", "error");
    if (!accessToken) return notify("Inicia sesión para responder.", "info");
    try {
      const answer = await createAnswer(Number(id), content.trim(), accessToken) as { id: number; content: string; createdAt: string; author: ApiQuestion["author"] };
      setQuestions((prev) => prev.map((q) => q.id !== id ? q : { ...q, status: q.status === "sin_responder" ? "respondida" : q.status, stats: { ...q.stats, answers: q.stats.answers + 1 }, answersPreview: [{ id: String(answer.id), authorName: authorName(answer.author), content: answer.content, votes: 0, createdAt: answer.createdAt }, ...(q.answersPreview ?? [])] }));
      notify("Respuesta publicada.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo publicar la respuesta."), "error");
    }
  };

  return { questions, stats, toast, notify, addQuestion, addAnswer, expanded, setExpanded, loading, error, retry: reload, courses: QUESTION_COURSES };
}
