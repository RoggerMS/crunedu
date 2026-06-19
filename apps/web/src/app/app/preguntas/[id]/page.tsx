"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createAnswer, createReport, deleteQuestion, getQuestionById, markAnswerUseful, mapApiError, uploadAnswerImage, voteAnswer, type UploadedAnswerImage } from "@/lib/api-helpers";
import { buildApiUrl } from "@/lib/http-client";
import { useAccessToken } from "@/hooks/useAccessToken";
import { buildLoginHref } from "@/lib/auth-routes";
import { AcademicComposer, type AcademicComposerImage } from "@/components/questions/AcademicComposer";
import { AcademicContentRenderer } from "@/components/questions/AcademicContentRenderer";
import { ImageGallery } from "@/components/questions/ImageGallery";
import { htmlToPlainText } from "@/components/questions/html-utils";
import { formatFullDate, formatRelativeDate } from "@/lib/format-date";

type ApiImage = { id: number; imageUrl: string; mimeType: string; sizeBytes: number; position: number };
type ApiAnswer = { id: number; content: string; createdAt: string; isUseful?: boolean; images?: ApiImage[]; votesScore?: number; upvotes?: number; downvotes?: number; viewerVote?: -1 | 0 | 1; author: { id?: number; firstName: string | null; lastName: string | null; email: string } };
type ApiQuestion = { id: number; title: string; content: string; createdAt: string; isResolved: boolean; isMine?: boolean; canMarkUseful?: boolean; author: { firstName: string | null; lastName: string | null; email: string }; community?: { id: number; name: string } | null; images?: ApiImage[]; answersCount: number; answers: ApiAnswer[] };

function authorName(author: ApiQuestion["author"]) {
  return [author.firstName, author.lastName].filter(Boolean).join(" ") || author.email || "Estudiante CrunEdu";
}

function imageSrc(imageUrl: string) {
  return buildApiUrl(imageUrl.replace(/^\/api/, ""));
}

function sortAnswers(answers: ApiAnswer[]) {
  return [...answers].sort((a, b) => Number(b.isUseful) - Number(a.isUseful) || (b.votesScore ?? 0) - (a.votesScore ?? 0) || +new Date(a.createdAt) - +new Date(b.createdAt));
}

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const questionId = useMemo(() => Number(params.id), [params.id]);
  const [question, setQuestion] = useState<ApiQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [answerImages, setAnswerImages] = useState<AcademicComposerImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const answerSubmitLockRef = useRef(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const loginHref = buildLoginHref(`/app/preguntas/${params.id}`);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function requireLogin() {
    if (isAuthenticated) return false;
    setError("Inicia sesión para realizar esta acción.");
    router.push(loginHref);
    return true;
  }

  useEffect(() => {
    let mounted = true;
    if (!Number.isInteger(questionId) || questionId < 1) {
      setError("Pregunta inválida.");
      setLoading(false);
      return;
    }
    setLoading(true);
    getQuestionById(questionId)
      .then((data) => { if (mounted) { setQuestion(data as ApiQuestion); setError(null); } })
      .catch((err) => mounted && setError(mapApiError(err, "No se pudo cargar la pregunta.")))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [questionId]);

  async function submitAnswer() {
    if (!question || submitting || answerSubmitLockRef.current) return;
    if (htmlToPlainText(draft).trim().length < 5) { setError("La respuesta debe tener al menos 5 caracteres."); return; }
    if (requireLogin()) return;
    answerSubmitLockRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const uploadedImages: UploadedAnswerImage[] = [];
      for (const image of answerImages) uploadedImages.push(await uploadAnswerImage(image.file));
      const answer = (await createAnswer(question.id, draft, accessToken ?? "", uploadedImages)) as ApiAnswer;
      setQuestion({ ...question, answers: sortAnswers([...question.answers, answer]), answersCount: question.answersCount + 1 });
      answerImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setAnswerImages([]);
      setDraft("");
      notify("Respuesta publicada.");
    } catch (err) {
      setError(mapApiError(err, "No se pudo publicar la respuesta."));
    } finally {
      answerSubmitLockRef.current = false;
      setSubmitting(false);
    }
  }

  async function toggleUseful(answerId: number) {
    if (!question || requireLogin()) return;
    try {
      const updated = (await markAnswerUseful(question.id, answerId, accessToken ?? "")) as ApiAnswer;
      const answers = question.answers.map((answer) => answer.id === answerId ? { ...answer, isUseful: updated.isUseful } : { ...answer, isUseful: false });
      setQuestion({ ...question, isResolved: Boolean(updated.isUseful), answers: sortAnswers(answers) });
      notify(updated.isUseful ? "Respuesta marcada como correcta." : "Se quitó la marca de correcta.");
    } catch (err) {
      setError(mapApiError(err, "No se pudo actualizar la respuesta."));
    }
  }

  async function handleVote(answer: ApiAnswer, value: -1 | 1) {
    if (!question || requireLogin()) return;
    const nextValue = answer.viewerVote === value ? 0 : value;
    try {
      const updated = (await voteAnswer(question.id, answer.id, nextValue, accessToken ?? "")) as ApiAnswer;
      setQuestion({ ...question, answers: sortAnswers(question.answers.map((item) => item.id === answer.id ? { ...item, ...updated, viewerVote: nextValue } : item)) });
    } catch (err) {
      setError(mapApiError(err, "No se pudo registrar el voto."));
    }
  }

  async function report(targetType: "QUESTION" | "ANSWER", targetId: number) {
    if (requireLogin()) return;
    try {
      await createReport({ targetType, targetId, reason: targetType === "QUESTION" ? "Reporte de pregunta" : "Reporte de respuesta" }, accessToken ?? "");
      setOpenMenu(null);
      notify("Reporte enviado.");
    } catch (err) {
      setError(mapApiError(err, "No se pudo enviar el reporte."));
    }
  }

  async function copyLink(fragment?: string) {
    const url = `${window.location.origin}/app/preguntas/${questionId}${fragment ?? ""}`;
    await navigator.clipboard.writeText(url);
    setOpenMenu(null);
    notify("Enlace copiado.");
  }

  async function handleDelete() {
    if (!question || !accessToken || !question.isMine) return;
    const confirmed = window.confirm("¿Seguro que deseas eliminar tu pregunta? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    try {
      await deleteQuestion(question.id, accessToken);
      setOpenMenu(null);
      notify("Pregunta eliminada.");
      router.push("/app/preguntas");
    } catch (err) {
      setError(mapApiError(err, "No se pudo eliminar la pregunta."));
    }
  }

  if (loading) return <section className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8"><p>Cargando pregunta...</p></section>;
  if (!question) return <section className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8"><p>{error ?? "No encontramos esta pregunta."}</p><Link href="/app/preguntas" className="mt-2 inline-block text-indigo-600">Volver a Preguntas</Link></section>;

  const answers = sortAnswers(question.answers);
  const galleryImages = (question.images ?? []).map((image) => ({ id: image.id, url: imageSrc(image.imageUrl), alt: question.title }));

  return (
    <section className="mx-auto grid max-w-[1540px] gap-4 px-4 py-6 sm:px-6 lg:px-8 xl:grid-cols-[1fr_320px]">
      <main className="min-w-0 space-y-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <Link className="text-sm font-semibold text-indigo-700" href="/app/preguntas">← Volver a Preguntas</Link>
            <div className="relative">
              <button onClick={() => setOpenMenu(openMenu === "question" ? null : "question")} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-bold text-slate-600" aria-label="Opciones de pregunta" type="button">⋮</button>
              {openMenu === "question" ? (
                <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                  <button onClick={() => void copyLink()} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Copiar enlace</button>
                  {question.isMine ? <button onClick={() => void handleDelete()} className="w-full rounded-lg px-3 py-2 text-left text-rose-700 hover:bg-rose-50" type="button">Eliminar pregunta</button> : null}
                  {isAuthenticated ? <button onClick={() => void report("QUESTION", question.id)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Reportar pregunta</button> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{authorName(question.author)}</span>
            <span aria-hidden="true">•</span>
            <span title={formatFullDate(question.createdAt)}>{formatRelativeDate(question.createdAt)}</span>
            <span aria-hidden="true">•</span>
            <span>{question.community?.name ?? "General"}</span>
          </div>

          <h1 className="mt-2 text-2xl font-black text-slate-950">{question.title}</h1>

          <div className="mt-3">
            <AcademicContentRenderer content={question.content} imageAlt="Imagen adjunta de la pregunta" resolveImageUrl={(url) => imageSrc(url)} />
          </div>

          {galleryImages.length ? <div className="mt-4"><ImageGallery images={galleryImages} alt="Imagen adjunta de la pregunta" /></div> : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${question.isResolved ? "bg-emerald-100 text-emerald-700" : question.answersCount > 0 ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"}`}>
              {question.isResolved ? "Resuelta" : question.answersCount > 0 ? "Con respuestas" : "Abierta"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{question.answersCount} respuestas</span>
            <button onClick={() => void copyLink()} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="button">Compartir</button>
          </div>
        </article>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Respuestas ({answers.length})</h2>
          {answers.length ? (
            <div className="mt-3 space-y-3">
              {answers.map((answer) => (
                <article id={`respuesta-${answer.id}`} key={answer.id} className={`rounded-xl border p-4 ${answer.isUseful ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{authorName(answer.author)}</span> · <span title={formatFullDate(answer.createdAt)}>{formatRelativeDate(answer.createdAt)}</span>
                    </p>
                    <div className="relative flex items-center gap-2">
                      {answer.isUseful ? <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">Respuesta correcta</span> : null}
                      <button onClick={() => setOpenMenu(openMenu === `answer-${answer.id}` ? null : `answer-${answer.id}`)} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600" aria-label="Opciones de respuesta" type="button">⋮</button>
                      {openMenu === `answer-${answer.id}` ? (
                        <div className="absolute right-0 top-7 z-10 w-56 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                          <button onClick={() => void copyLink(`#respuesta-${answer.id}`)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Copiar enlace</button>
                          {question.canMarkUseful ? (
                            <button onClick={() => void toggleUseful(answer.id)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">
                              {answer.isUseful ? "Quitar marca de correcta" : "Marcar como correcta"}
                            </button>
                          ) : null}
                          {isAuthenticated ? <button onClick={() => void report("ANSWER", answer.id)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Reportar respuesta</button> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2">
                    <AcademicContentRenderer content={answer.content} images={answer.images} imageAlt="Imagen adjunta de la respuesta" resolveImageUrl={(url) => imageSrc(url)} smallImages />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => void handleVote(answer, 1)}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold ${answer.viewerVote === 1 ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      type="button"
                      aria-label="Voto positivo"
                    >▲ {answer.upvotes ?? 0}</button>
                    <button
                      onClick={() => void handleVote(answer, -1)}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold ${answer.viewerVote === -1 ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      type="button"
                      aria-label="Voto negativo"
                    >▼ {answer.downvotes ?? 0}</button>
                    <span className="text-xs font-semibold text-slate-500">Puntaje: {answer.votesScore ?? 0}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Esta pregunta aún no tiene respuestas. ¡Sé la primera persona en ayudar!</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Responder</h2>
          {!isAuthenticated ? <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Necesitas iniciar sesión para responder. <Link href={loginHref} className="font-bold text-indigo-700 underline">Iniciar sesión</Link></p> : null}
          <div className="mt-3">
            <AcademicComposer
              mode="answer"
              value={draft}
              onChange={setDraft}
              placeholder="Escribe una explicación paso a paso. Puedes adjuntar una imagen de tu procedimiento."
              maxLength={3000}
              allowImages
              images={answerImages}
              onImagesChange={setAnswerImages}
              onError={setError}
              disabled={submitting || !isAuthenticated}
            />
          </div>
          {error ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button
            disabled={submitting || htmlToPlainText(draft).trim().length < 5 || !isAuthenticated}
            onClick={() => void submitAnswer()}
            className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-600"
            type="button"
          >{submitting ? "Publicando respuesta..." : "Publicar respuesta"}</button>
        </section>
      </main>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">Cómo ayudar mejor</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Explica el procedimiento, no solo el resultado.</li>
          <li>Si una respuesta tiene un error, responde con respeto y corrige el paso.</li>
          <li>Vota las respuestas útiles y reporta contenido problemático.</li>
        </ul>
      </aside>

      {toast ? <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{toast}</div> : null}
    </section>
  );
}
