"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { Card, PrimaryButton, SecondaryButton, StatusMessage, TextArea } from "@/components/ui";

type DebateResponse = {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
};

type DebateItem = {
  id: number;
  courseKey: string;
  weeklyTopic: string;
  stance: string;
  createdAt: string;
  authorId: number;
  responses: DebateResponse[];
};

export default function DebateDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const courseKey = searchParams.get("courseKey") ?? "";
  const debateId = Number(params.id);

  const [debate, setDebate] = useState<DebateItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { accessToken, isAuthenticated } = useAccessToken();

  async function loadDebate() {
    if (!courseKey || Number.isNaN(debateId)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ items: DebateItem[] }>(`/debates?courseKey=${encodeURIComponent(courseKey)}`);
      const found = (data.items ?? []).find((item) => item.id === debateId);
      if (!found) {
        setError("Debate no encontrado para este canal.");
        setDebate(null);
        return;
      }
      setDebate(found);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar el detalle del debate."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDebate();
  }, [courseKey, debateId]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = reply.trim();
    if (!content) return;
    if (!isAuthenticated) {
      setError("Inicia sesión para responder debates.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await apiRequest(`/debates/${debateId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content }),
      });
      setReply("");
      await loadDebate();
    } catch (err) {
      setError(mapApiError(err, "No se pudo enviar la respuesta."));
    } finally {
      setSending(false);
    }
  }

  const headerLabel = useMemo(() => {
    if (!debate) return "Detalle del debate";
    return `${debate.courseKey} · Debate #${debate.id}`;
  }, [debate]);

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{headerLabel}</p>
          <SecondaryButton asChild><Link href="/app/debates">Volver a debates</Link></SecondaryButton>
        </div>

        {loading ? <StatusMessage type="loading">Cargando debate...</StatusMessage> : null}
        {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

        {debate ? (
          <>
            <h1 className="text-2xl font-black">{debate.weeklyTopic}</h1>
            <p className="text-sm text-slate-500">Publicado: {new Date(debate.createdAt).toLocaleString("es-PE")}</p>
            <p className="text-slate-700">{debate.stance}</p>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold">Respuestas ({debate.responses.length})</p>
              <div className="mt-2 space-y-2">
                {debate.responses.map((response) => (
                  <div key={response.id} className="rounded-lg bg-slate-50 p-2 text-sm">
                    <p>{response.content}</p>
                    <p className="mt-1 text-xs text-slate-500">Usuario #{response.authorId} · {new Date(response.createdAt).toLocaleString("es-PE")}</p>
                  </div>
                ))}
                {debate.responses.length === 0 ? <p className="text-sm text-slate-500">Aún no hay respuestas.</p> : null}
              </div>
            </div>

            <form className="space-y-2" onSubmit={handleReply}>
              <TextArea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} maxLength={800} placeholder="Escribe tu respuesta al debate" />
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="submit" disabled={sending}>{sending ? "Enviando..." : "Responder"}</PrimaryButton>
                {!isAuthenticated ? <SecondaryButton asChild><Link href="/login">Iniciar sesión</Link></SecondaryButton> : null}
              </div>
            </form>
          </>
        ) : null}
      </Card>
    </main>
  );
}
