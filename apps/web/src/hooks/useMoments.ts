"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fallbackMoments, fallbackNews } from "@/components/moments/moments-data";
import type {
  MomentComment,
  MomentItem,
  MomentNewsSummary,
  MomentTopic,
  MomentTrend,
  MomentView,
} from "@/components/moments/types";
import {
  boostMoment as apiBoostMoment,
  confirmMoment as apiConfirmMoment,
  createMoment as apiCreateMoment,
  createMomentComment as apiCreateMomentComment,
  deleteMoment as apiDeleteMoment,
  deleteMomentComment as apiDeleteMomentComment,
  getMomentComments as apiGetMomentComments,
  getMomentGallery,
  getMomentNews,
  getMomentTopics,
  getMomentTrends,
  getMoments as apiGetMoments,
  getSavedMoments,
  saveMoment as apiSaveMoment,
  shareMoment as apiShareMoment,
  unboostMoment as apiUnboostMoment,
  unconfirmMoment as apiUnconfirmMoment,
  unsaveMoment as apiUnsaveMoment,
  updateMoment as apiUpdateMoment,
  uploadMomentMedia as apiUploadMomentMedia,
  type MomentItemApi,
  type MomentCommentApi,
  type MomentNewsSummaryApi,
} from "@/lib/moments-api";
import { mapApiError } from "@/lib/http-client";

const PREF_KEY = "crunedu_moments_default_view";
const IS_DEV = process.env.NODE_ENV === "development";

function mapApiMoment(item: MomentItemApi): MomentItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    type: item.type as MomentItem["type"],
    location: item.location ?? undefined,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    tags: item.tags,
    media: item.media.map((m) => ({ id: m.id, type: m.type, url: m.url, alt: m.alt ?? undefined })),
    author: { id: item.author.id, name: item.author.name, avatarUrl: item.author.avatarUrl ?? undefined },
    stats: item.stats,
    viewerState: { boosted: item.viewerState.boosted, passed: false, saved: item.viewerState.saved, confirmed: item.viewerState.confirmed },
    status: item.status as MomentItem["status"],
    isMine: item.isMine,
    canEdit: item.canEdit,
    canDelete: item.canDelete,
  };
}

function mapApiNews(item: MomentNewsSummaryApi): MomentNewsSummary {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    tags: item.tags,
    status: item.status,
    relatedMomentIds: item.relatedMomentIds,
    updatedAt: item.updatedAt,
    stats: item.stats,
    coverImageUrl: item.coverImageUrl ?? undefined,
  };
}

function mapApiComment(item: MomentCommentApi): MomentComment {
  return {
    id: item.id,
    momentId: item.momentId,
    author: item.author.name,
    authorAvatarUrl: item.author.avatarUrl ?? undefined,
    content: item.content,
    createdAt: item.createdAt,
    isMine: item.isMine,
  };
}

export type MomentsSort = "recent" | "relevant";

export function useMoments() {
  const [moments, setMoments] = useState<MomentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const [newsSummaries, setNewsSummaries] = useState<MomentNewsSummary[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const [savedMoments, setSavedMoments] = useState<MomentItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  const [galleryMoments, setGalleryMoments] = useState<MomentItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const [trends, setTrends] = useState<MomentTrend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const [topics, setTopics] = useState<MomentTopic[]>([]);

  const [comments, setComments] = useState<MomentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [activeView, setActiveViewState] = useState<MomentView>("moments");
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MomentsSort>("recent");
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reqIdRef = useRef(0);
  const momentsRef = useRef<MomentItem[]>([]);
  useEffect(() => { momentsRef.current = moments; }, [moments]);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(PREF_KEY) as MomentView | null;
    if (savedPreference) setActiveViewState(savedPreference);
  }, []);

  const showToast = useCallback((message: string | null) => {
    setToast(message);
    if (message) {
      window.setTimeout(() => setToast((current) => (current === message ? null : current)), 3200);
    }
  }, []);

  // --- Fetch main moments feed ---
  const fetchMoments = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGetMoments({ sort, q: query.trim() || undefined, limit: 20 });
      if (reqId !== reqIdRef.current) return;
      setMoments(response.items.map(mapApiMoment));
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      const message = mapApiError(err, "No se pudieron cargar los momentos.");
      if (IS_DEV) {
        setMoments(fallbackMoments);
        showToast("Mostrando momentos de prueba (modo desarrollo).");
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [query, sort, showToast]);

  useEffect(() => {
    void fetchMoments();
    setCurrentMomentIndex(0);
  }, [fetchMoments, retryToken]);

  // --- Fetch data when switching to specialized views ---
  useEffect(() => {
    if (activeView === "news") {
      setNewsLoading(true);
      setNewsError(null);
      getMomentNews()
        .then((res) => {
          setNewsSummaries(res.items.map(mapApiNews));
          if (res.items.length === 0 && IS_DEV) {
            setNewsSummaries(fallbackNews);
          }
        })
        .catch((err) => {
          const message = mapApiError(err, "No se pudieron cargar las noticias.");
          if (IS_DEV) {
            setNewsSummaries(fallbackNews);
            showToast("Mostrando noticias de prueba (modo desarrollo).");
          } else {
            setNewsError(message);
          }
        })
        .finally(() => setNewsLoading(false));
    }
    if (activeView === "gallery") {
      setGalleryLoading(true);
      setGalleryError(null);
      getMomentGallery({ limit: 24 })
        .then((res) => setGalleryMoments(res.items.map(mapApiMoment)))
        .catch((err) => {
          const message = mapApiError(err, "No se pudo cargar la galería.");
          if (IS_DEV) setGalleryMoments(fallbackMoments.filter((m) => m.media.length > 0));
          else setGalleryError(message);
        })
        .finally(() => setGalleryLoading(false));
    }
    if (activeView === "saved") {
      setSavedLoading(true);
      setSavedError(null);
      getSavedMoments({ limit: 30 })
        .then((res) => setSavedMoments(res.items.map(mapApiMoment)))
        .catch((err) => {
          const message = mapApiError(err, "No se pudieron cargar tus guardados.");
          if (IS_DEV) setSavedMoments(fallbackMoments.filter((m) => m.viewerState.saved));
          else setSavedError(message);
        })
        .finally(() => setSavedLoading(false));
    }
    if (activeView === "trends") {
      setTrendsLoading(true);
      setTrendsError(null);
      Promise.all([getMomentTrends({ period: "week", limit: 12 }), getMomentTopics()])
        .then(([trendsRes, topicsRes]) => {
          setTrends(trendsRes.items);
          setTopics(topicsRes.items);
        })
        .catch((err) => {
          const message = mapApiError(err, "No se pudieron cargar las tendencias.");
          if (IS_DEV) {
            setTrends([
              { position: 1, tag: "Comedor", moments: 2, boosts: 20, growth: 12 },
              { position: 2, tag: "Matrícula", moments: 1, boosts: 32, growth: 8 },
              { position: 3, tag: "Cultura", moments: 1, boosts: 44, growth: 5 },
            ]);
            showToast("Mostrando tendencias de prueba (modo desarrollo).");
          } else {
            setTrendsError(message);
          }
        })
        .finally(() => setTrendsLoading(false));
    }
  }, [activeView, showToast]);

  const filteredMoments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return moments
      .filter((m) => (activeView === "saved" ? m.viewerState.saved : new Date(m.expiresAt) > new Date() || m.viewerState.saved))
      .filter((m) => (q ? `${m.title} ${m.location ?? ""} ${m.tags.join(" ")}`.toLowerCase().includes(q) : true))
      .sort((a, b) => score(b) - score(a));
  }, [moments, activeView, query]);

  const currentMoment = filteredMoments[currentMomentIndex] ?? null;

  function setActiveView(view: MomentView) {
    setActiveViewState(view);
    if (typeof window !== "undefined") window.localStorage.setItem(PREF_KEY, view);
  }

  function mutateMoment(id: string, fn: (m: MomentItem) => MomentItem) {
    setMoments((all) => all.map((m) => (m.id === id ? fn(m) : m)));
  }

  function withOptimistic(id: string, apply: (m: MomentItem) => MomentItem, revert: (m: MomentItem) => MomentItem) {
    const snapshot = momentsRef.current.find((m) => m.id === id) ?? null;
    setMoments((all) => all.map((m) => (m.id === id ? apply(m) : m)));
    return () => {
      if (snapshot) {
        setMoments((all) => all.map((m) => (m.id === id ? revert(snapshot) : m)));
      }
    };
  }

  const boostMoment = useCallback(async (id: string) => {
    const rollback = withOptimistic(
      id,
      (m) => ({ ...m, stats: { ...m.stats, boosts: m.stats.boosts + (m.viewerState.boosted ? 0 : 1) }, viewerState: { ...m.viewerState, boosted: true } }),
      (m) => m,
    );
    try {
      const res = await apiBoostMoment(id);
      mutateMoment(id, (m) => ({ ...m, stats: { ...m.stats, boosts: res.count }, viewerState: { ...m.viewerState, boosted: res.boosted } }));
      showToast("Momento impulsado.");
    } catch (err) {
      rollback();
      showToast(mapApiError(err, "No se pudo impulsar el momento."));
    }
  }, [showToast]);

  const unboostMoment = useCallback(async (id: string) => {
    const rollback = withOptimistic(
      id,
      (m) => ({ ...m, stats: { ...m.stats, boosts: Math.max(0, m.stats.boosts - 1) }, viewerState: { ...m.viewerState, boosted: false } }),
      (m) => m,
    );
    try {
      const res = await apiUnboostMoment(id);
      mutateMoment(id, (m) => ({ ...m, stats: { ...m.stats, boosts: res.count }, viewerState: { ...m.viewerState, boosted: res.boosted } }));
    } catch (err) {
      rollback();
      showToast(mapApiError(err, "No se pudo actualizar el impulso."));
    }
  }, [showToast]);

  const confirmMoment = useCallback(async (id: string) => {
    const rollback = withOptimistic(
      id,
      (m) => ({ ...m, stats: { ...m.stats, confirmations: m.stats.confirmations + (m.viewerState.confirmed ? 0 : 1) }, viewerState: { ...m.viewerState, confirmed: true } }),
      (m) => m,
    );
    try {
      const res = await apiConfirmMoment(id);
      mutateMoment(id, (m) => ({ ...m, stats: { ...m.stats, confirmations: res.count }, viewerState: { ...m.viewerState, confirmed: res.confirmed } }));
      showToast("Momento confirmado.");
    } catch (err) {
      rollback();
      showToast(mapApiError(err, "No se pudo confirmar el momento."));
    }
  }, [showToast]);

  const passMoment = useCallback((id: string) => {
    mutateMoment(id, (m) => ({ ...m, viewerState: { ...m.viewerState, passed: true } }));
    setHistory((h) => [...new Set([id, ...h])].slice(0, 24));
    setCurrentMomentIndex((v) => (filteredMoments.length ? (v + 1) % filteredMoments.length : 0));
  }, [filteredMoments.length]);

  const saveMoment = useCallback(async (id: string) => {
    const target = moments.find((m) => m.id === id);
    const next = !target?.viewerState.saved;
    const rollback = withOptimistic(
      id,
      (m) => ({ ...m, viewerState: { ...m.viewerState, saved: next } }),
      (m) => m,
    );
    try {
      if (next) await apiSaveMoment(id);
      else await apiUnsaveMoment(id);
      showToast(next ? "Momento guardado." : "Momento quitado de guardados.");
      if (activeView === "saved" && !next) {
        setSavedMoments((all) => all.filter((m) => m.id !== id));
      }
    } catch (err) {
      rollback();
      showToast(mapApiError(err, "No se pudo actualizar el guardado."));
    }
  }, [moments, activeView, showToast]);

  const shareMoment = useCallback(async (id: string) => {
    const link = `${window.location.origin}/app/momentos/${id}`;
    try {
      await apiShareMoment(id);
      mutateMoment(id, (m) => ({ ...m, stats: { ...m.stats, shares: m.stats.shares + 1 } }));
    } catch {
      // share count registration is best-effort
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(link).catch(() => undefined);
    }
    showToast("Enlace copiado.");
  }, [showToast]);

  const openComments = useCallback(async (momentId: string) => {
    setCommentsLoading(true);
    try {
      const res = await apiGetMomentComments(momentId);
      setComments(res.map(mapApiComment));
    } catch (err) {
      showToast(mapApiError(err, "No se pudieron cargar los comentarios."));
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [showToast]);

  const commentMoment = useCallback(async (momentId: string, content: string) => {
    const optimistic: MomentComment = {
      id: `tmp-${Date.now()}`,
      momentId,
      author: "Tú",
      content,
      createdAt: new Date().toISOString(),
      isMine: true,
    };
    setComments((v) => [...v, optimistic]);
    mutateMoment(momentId, (m) => ({ ...m, stats: { ...m.stats, comments: m.stats.comments + 1 } }));
    try {
      const created = await apiCreateMomentComment(momentId, content);
      setComments((v) => [...v.filter((c) => c.id !== optimistic.id), mapApiComment(created)]);
    } catch (err) {
      setComments((v) => v.filter((c) => c.id !== optimistic.id));
      mutateMoment(momentId, (m) => ({ ...m, stats: { ...m.stats, comments: Math.max(0, m.stats.comments - 1) } }));
      showToast(mapApiError(err, "No se pudo publicar el comentario."));
    }
  }, [showToast]);

  const deleteComment = useCallback(async (momentId: string, commentId: string) => {
    const snapshot = comments;
    setComments((v) => v.filter((c) => c.id !== commentId));
    mutateMoment(momentId, (m) => ({ ...m, stats: { ...m.stats, comments: Math.max(0, m.stats.comments - 1) } }));
    try {
      await apiDeleteMomentComment(momentId, commentId);
      showToast("Comentario eliminado.");
    } catch (err) {
      setComments(snapshot);
      mutateMoment(momentId, (m) => ({ ...m, stats: { ...m.stats, comments: m.stats.comments + 1 } }));
      showToast(mapApiError(err, "No se pudo eliminar el comentario."));
    }
  }, [comments, showToast]);

  const createMoment = useCallback(async (input: {
    title: string;
    description?: string;
    location?: string;
    type: MomentItem["type"];
    tags: string[];
    durationHours: number;
    media?: { imageUrl: string; storageKey: string; mimeType: string; sizeBytes: number }[];
  }) => {
    setSubmitting(true);
    try {
      const created = await apiCreateMoment({
        title: input.title,
        description: input.description,
        location: input.location,
        type: input.type,
        tags: input.tags,
        durationHours: input.durationHours,
        media: input.media,
      });
      const mapped = mapApiMoment(created);
      setMoments((all) => [mapped, ...all]);
      setCurrentMomentIndex(0);
      setActiveViewState("moments");
      showToast("Momento publicado.");
      return mapped;
    } catch (err) {
      showToast(mapApiError(err, "No se pudo publicar el momento."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [showToast]);

  const editMoment = useCallback(async (id: string, payload: Partial<{ title: string; description?: string; location?: string; type: MomentItem["type"]; tags: string[]; durationHours: number }>) => {
    setSubmitting(true);
    try {
      const updated = await apiUpdateMoment(id, payload);
      const mapped = mapApiMoment(updated);
      mutateMoment(id, () => mapped);
      showToast("Momento actualizado.");
      return mapped;
    } catch (err) {
      showToast(mapApiError(err, "No se pudo actualizar el momento."));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [showToast]);

  const removeMoment = useCallback(async (id: string) => {
    const snapshot = moments;
    setMoments((all) => all.filter((m) => m.id !== id));
    try {
      await apiDeleteMoment(id);
      showToast("Momento eliminado.");
    } catch (err) {
      setMoments(snapshot);
      showToast(mapApiError(err, "No se pudo eliminar el momento."));
    }
  }, [moments, showToast]);

  const uploadMedia = useCallback(async (file: File) => {
    return apiUploadMomentMedia(file);
  }, []);

  function openDetails(id: string) {
    return `/app/momentos/${id}`;
  }
  function selectFromHistory(id: string) {
    const idx = filteredMoments.findIndex((m) => m.id === id);
    if (idx >= 0) setCurrentMomentIndex(idx);
  }
  function nextMoment() {
    setCurrentMomentIndex((v) => (filteredMoments.length ? (v + 1) % filteredMoments.length : 0));
  }
  function previousMoment() {
    setCurrentMomentIndex((v) => (filteredMoments.length ? (v - 1 + filteredMoments.length) % filteredMoments.length : 0));
  }
  function retry() {
    setRetryToken((t) => t + 1);
  }

  return {
    moments,
    filteredMoments,
    currentMoment,
    currentMomentIndex,
    loading,
    error,
    retry,
    newsSummaries,
    newsLoading,
    newsError,
    savedMoments,
    savedLoading,
    savedError,
    galleryMoments,
    galleryLoading,
    galleryError,
    trends,
    trendsLoading,
    trendsError,
    topics,
    comments,
    commentsLoading,
    activeView,
    setActiveView,
    history,
    query,
    setQuery,
    sort,
    setSort,
    toast,
    setToast: showToast,
    submitting,
    boostMoment,
    unboostMoment,
    passMoment,
    confirmMoment,
    saveMoment,
    shareMoment,
    openComments,
    commentMoment,
    deleteComment,
    createMoment,
    editMoment,
    removeMoment,
    uploadMedia,
    openDetails,
    selectFromHistory,
    nextMoment,
    previousMoment,
  };
}

function score(moment: MomentItem) {
  const hours = (Date.now() - new Date(moment.createdAt).getTime()) / 3600_000;
  return moment.stats.boosts * 3 + moment.stats.confirmations * 4 + moment.stats.comments * 2 - hours * 5;
}
