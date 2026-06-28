"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fallbackMoments,
  fallbackNews,
} from "@/components/moments/moments-data";
import type {
  MomentComment,
  MomentItem,
  MomentNewsSummary,
  MomentTopic,
  MomentTrend,
  MomentView,
} from "@/components/moments/types";
import {
  likeMoment as apiLikeMoment,
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
  shareMomentToFeed as apiShareMomentToFeed,
  removeMomentFromFeed as apiRemoveMomentFromFeed,
  unconfirmMoment as apiUnconfirmMoment,
  unlikeMoment as apiUnlikeMoment,
  unsaveMoment as apiUnsaveMoment,
  updateMoment as apiUpdateMoment,
  uploadMomentMedia as apiUploadMomentMedia,
  type MomentItemApi,
  type MomentCommentApi,
  type MomentNewsSummaryApi,
} from "@/lib/moments-api";
import { mapApiError } from "@/lib/http-client";

const PREF_KEY = "crunedu_moments_default_view";
const VIEW_MODE_KEY = "crunedu_moments_view_mode";
const USE_FALLBACK = process.env.NEXT_PUBLIC_MOMENTS_USE_FALLBACK === "true";

export type MomentsSort = "recent" | "relevant";
export type MomentsViewMode = "single" | "explore";

function mapApiMoment(item: MomentItemApi): MomentItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? undefined,
    type: item.type as MomentItem["type"],
    location: item.location ?? undefined,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
    isPermanent: item.isPermanent,
    inFeed: item.inFeed,
    tags: item.tags,
    media: item.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      alt: m.alt ?? undefined,
    })),
    author: {
      id: item.author.id,
      name: item.author.name,
      avatarUrl: item.author.avatarUrl ?? undefined,
    },
    stats: item.stats,
    viewerState: {
      liked: item.viewerState.liked,
      saved: item.viewerState.saved,
      confirmed: item.viewerState.confirmed,
    },
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
    createdAt: item.createdAt,
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

function useViewMode() {
  const [viewMode, setViewModeState] = useState<MomentsViewMode>("single");
  const [preferenceAsked, setPreferenceAsked] = useState(false);

  useEffect(() => {
    const stored = (
      typeof window !== "undefined"
        ? window.localStorage.getItem(VIEW_MODE_KEY)
        : null
    ) as MomentsViewMode | null;
    if (stored === "single" || stored === "explore") {
      setViewModeState(stored);
      setPreferenceAsked(true);
    } else {
      setPreferenceAsked(false);
    }
  }, []);

  const setViewMode = useCallback((mode: MomentsViewMode) => {
    setViewModeState(mode);
    setPreferenceAsked(true);
    if (typeof window !== "undefined")
      window.localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  return { viewMode, setViewMode, preferenceAsked };
}

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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MomentsSort>("recent");
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reqIdRef = useRef(0);
  const momentsRef = useRef<MomentItem[]>([]);
  useEffect(() => {
    momentsRef.current = moments;
  }, [moments]);

  const { viewMode, setViewMode, preferenceAsked } = useViewMode();

  const showToast = useCallback((message: string | null) => {
    setToast(message);
    if (message) {
      window.setTimeout(
        () => setToast((current) => (current === message ? null : current)),
        3200,
      );
    }
  }, []);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(
      PREF_KEY,
    ) as MomentView | null;
    if (savedPreference) setActiveViewState(savedPreference);
  }, []);

  // --- Fetch main moments feed ---
  const fetchMoments = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGetMoments({
        sort,
        q: query.trim() || undefined,
        limit: 20,
      });
      if (reqId !== reqIdRef.current) return;
      setMoments(response.items.map(mapApiMoment));
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      if (USE_FALLBACK) {
        setMoments(fallbackMoments);
        setError(null);
      } else {
        setError(mapApiError(err, "No se pudieron cargar los momentos."));
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [query, sort]);

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
        .then((res) => setNewsSummaries(res.items.map(mapApiNews)))
        .catch((err) => {
          if (USE_FALLBACK) setNewsSummaries(fallbackNews);
          else
            setNewsError(
              mapApiError(err, "No se pudieron cargar las noticias."),
            );
        })
        .finally(() => setNewsLoading(false));
    }
    if (activeView === "gallery") {
      setGalleryLoading(true);
      setGalleryError(null);
      getMomentGallery({ limit: 24 })
        .then((res) => setGalleryMoments(res.items.map(mapApiMoment)))
        .catch((err) => {
          if (USE_FALLBACK)
            setGalleryMoments(
              fallbackMoments.filter((m) => m.media.length > 0),
            );
          else
            setGalleryError(mapApiError(err, "No se pudo cargar la galería."));
        })
        .finally(() => setGalleryLoading(false));
    }
    if (activeView === "saved") {
      setSavedLoading(true);
      setSavedError(null);
      getSavedMoments({ limit: 30 })
        .then((res) => setSavedMoments(res.items.map(mapApiMoment)))
        .catch((err) => {
          if (!USE_FALLBACK)
            setSavedError(
              mapApiError(err, "No se pudieron cargar tus guardados."),
            );
        })
        .finally(() => setSavedLoading(false));
    }
    if (activeView === "trends") {
      setTrendsLoading(true);
      setTrendsError(null);
      Promise.all([
        getMomentTrends({ period: "week", limit: 12 }),
        getMomentTopics(),
      ])
        .then(([trendsRes, topicsRes]) => {
          setTrends(trendsRes.items);
          setTopics(topicsRes.items);
        })
        .catch((err) => {
          if (!USE_FALLBACK)
            setTrendsError(
              mapApiError(err, "No se pudieron cargar las tendencias."),
            );
        })
        .finally(() => setTrendsLoading(false));
    }
  }, [activeView]);

  const filteredMoments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return moments
      .filter((m) => {
        if (activeView === "saved") return m.viewerState.saved;
        if (m.isPermanent) return true;
        if (m.expiresAt)
          return new Date(m.expiresAt) > new Date() || m.viewerState.saved;
        return true;
      })
      .filter((m) =>
        q
          ? `${m.title} ${m.location ?? ""} ${m.tags.join(" ")}`
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => score(b) - score(a));
  }, [moments, activeView, query]);

  const currentMoment = filteredMoments[currentMomentIndex] ?? null;

  function setActiveView(view: MomentView) {
    setActiveViewState(view);
    if (typeof window !== "undefined")
      window.localStorage.setItem(PREF_KEY, view);
  }

  function mutateMoment(id: string, fn: (m: MomentItem) => MomentItem) {
    setMoments((all) => all.map((m) => (m.id === id ? fn(m) : m)));
    setSavedMoments((all) => all.map((m) => (m.id === id ? fn(m) : m)));
    setGalleryMoments((all) => all.map((m) => (m.id === id ? fn(m) : m)));
  }

  function withOptimistic(
    id: string,
    apply: (m: MomentItem) => MomentItem,
    revert: (m: MomentItem) => MomentItem,
  ) {
    const snapshot = momentsRef.current.find((m) => m.id === id) ?? null;
    setMoments((all) => all.map((m) => (m.id === id ? apply(m) : m)));
    return () => {
      if (snapshot) {
        setMoments((all) =>
          all.map((m) => (m.id === id ? revert(snapshot) : m)),
        );
      }
    };
  }

  const likeMomentAction = useCallback(
    async (id: string) => {
      const target = momentsRef.current.find((m) => m.id === id);
      const wasLiked = target?.viewerState.liked ?? false;
      const rollback = withOptimistic(
        id,
        (m) => ({
          ...m,
          stats: { ...m.stats, likes: m.stats.likes + (wasLiked ? -1 : 1) },
          viewerState: { ...m.viewerState, liked: !wasLiked },
        }),
        (m) => m,
      );
      try {
        const res = wasLiked
          ? await apiUnlikeMoment(id)
          : await apiLikeMoment(id);
        mutateMoment(id, (m) => ({
          ...m,
          stats: { ...m.stats, likes: res.count },
          viewerState: { ...m.viewerState, liked: res.liked },
        }));
      } catch (err) {
        rollback();
        showToast(mapApiError(err, "No se pudo actualizar el Me gusta."));
      }
    },
    [showToast],
  );

  const confirmMomentAction = useCallback(
    async (id: string) => {
      const target = momentsRef.current.find((m) => m.id === id);
      const wasConfirmed = target?.viewerState.confirmed ?? false;
      const rollback = withOptimistic(
        id,
        (m) => ({
          ...m,
          stats: {
            ...m.stats,
            confirmations: m.stats.confirmations + (wasConfirmed ? -1 : 1),
          },
          viewerState: { ...m.viewerState, confirmed: !wasConfirmed },
        }),
        (m) => m,
      );
      try {
        const res = wasConfirmed
          ? await apiUnconfirmMoment(id)
          : await apiConfirmMoment(id);
        mutateMoment(id, (m) => ({
          ...m,
          stats: { ...m.stats, confirmations: res.count },
          viewerState: { ...m.viewerState, confirmed: res.confirmed },
        }));
      } catch (err) {
        rollback();
        showToast(mapApiError(err, "No se pudo actualizar la confirmación."));
      }
    },
    [showToast],
  );

  const saveMomentAction = useCallback(
    async (id: string) => {
      const target =
        moments.find((m) => m.id === id) ??
        savedMoments.find((m) => m.id === id) ??
        galleryMoments.find((m) => m.id === id);
      const next = activeView === "saved" ? false : !target?.viewerState.saved;
      const rollback = withOptimistic(
        id,
        (m) => ({ ...m, viewerState: { ...m.viewerState, saved: next } }),
        (m) => m,
      );
      try {
        if (next) await apiSaveMoment(id);
        else await apiUnsaveMoment(id);
        if (activeView === "saved" && !next) {
          setSavedMoments((all) => all.filter((m) => m.id !== id));
        }
      } catch (err) {
        rollback();
        showToast(mapApiError(err, "No se pudo actualizar el guardado."));
      }
    },
    [moments, savedMoments, galleryMoments, activeView, showToast],
  );

  const shareMomentAction = useCallback(
    async (id: string) => {
      const link = `${window.location.origin}/app/momentos/${id}`;
      try {
        await apiShareMoment(id);
        mutateMoment(id, (m) => ({
          ...m,
          stats: { ...m.stats, shares: m.stats.shares + 1 },
        }));
      } catch {
        // best-effort
      }
      if (typeof navigator !== "undefined") {
        if (navigator.share) {
          try {
            await navigator.share({ title: "Momento en CrunEdu", url: link });
            return;
          } catch {
            /* fall through to clipboard */
          }
        }
        if (navigator.clipboard)
          await navigator.clipboard.writeText(link).catch(() => undefined);
      }
      showToast("Enlace copiado.");
    },
    [showToast],
  );

  const shareToFeedAction = useCallback(
    async (id: string) => {
      try {
        await apiShareMomentToFeed(id);
        mutateMoment(id, (m) => ({ ...m, inFeed: true }));
        showToast("Ahora también aparece en tu Feed.");
      } catch (err) {
        showToast(mapApiError(err, "No se pudo compartir en el Feed."));
      }
    },
    [showToast],
  );

  const removeFromFeedAction = useCallback(
    async (id: string) => {
      try {
        await apiRemoveMomentFromFeed(id);
        mutateMoment(id, (m) => ({ ...m, inFeed: false }));
        showToast("Se quitó del Feed.");
      } catch (err) {
        showToast(mapApiError(err, "No se pudo quitar del Feed."));
      }
    },
    [showToast],
  );

  const openComments = useCallback(
    async (momentId: string) => {
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
    },
    [showToast],
  );

  const commentMoment = useCallback(
    async (momentId: string, content: string) => {
      const optimistic: MomentComment = {
        id: `tmp-${Date.now()}`,
        momentId,
        author: "Tú",
        content,
        createdAt: new Date().toISOString(),
        isMine: true,
      };
      setComments((v) => [...v, optimistic]);
      mutateMoment(momentId, (m) => ({
        ...m,
        stats: { ...m.stats, comments: m.stats.comments + 1 },
      }));
      try {
        const created = await apiCreateMomentComment(momentId, content);
        setComments((v) => [
          ...v.filter((c) => c.id !== optimistic.id),
          mapApiComment(created),
        ]);
      } catch (err) {
        setComments((v) => v.filter((c) => c.id !== optimistic.id));
        mutateMoment(momentId, (m) => ({
          ...m,
          stats: { ...m.stats, comments: Math.max(0, m.stats.comments - 1) },
        }));
        showToast(mapApiError(err, "No se pudo publicar el comentario."));
      }
    },
    [showToast],
  );

  const deleteComment = useCallback(
    async (momentId: string, commentId: string) => {
      const snapshot = comments;
      setComments((v) => v.filter((c) => c.id !== commentId));
      mutateMoment(momentId, (m) => ({
        ...m,
        stats: { ...m.stats, comments: Math.max(0, m.stats.comments - 1) },
      }));
      try {
        await apiDeleteMomentComment(momentId, commentId);
      } catch (err) {
        setComments(snapshot);
        mutateMoment(momentId, (m) => ({
          ...m,
          stats: { ...m.stats, comments: m.stats.comments + 1 },
        }));
        showToast(mapApiError(err, "No se pudo eliminar el comentario."));
      }
    },
    [comments, showToast],
  );

  const createMoment = useCallback(
    async (input: {
      title: string;
      description?: string;
      location?: string;
      type: MomentItem["type"];
      tags: string[];
      durationHours?: number;
      isPermanent?: boolean;
      shareToFeed?: boolean;
      media?: {
        imageUrl: string;
        storageKey: string;
        mimeType: string;
        sizeBytes: number;
      }[];
    }) => {
      setSubmitting(true);
      try {
        const created = await apiCreateMoment({
          title: input.title,
          description: input.description,
          location: input.location,
          type: input.type,
          tags: input.tags,
          durationHours: input.isPermanent ? undefined : input.durationHours,
          isPermanent: input.isPermanent,
          shareToFeed: input.shareToFeed,
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
    },
    [showToast],
  );

  const editMoment = useCallback(
    async (
      id: string,
      payload: Partial<{
        title: string;
        description?: string;
        location?: string;
        type: MomentItem["type"];
        tags: string[];
        durationHours: number;
        isPermanent: boolean;
      }>,
    ) => {
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
    },
    [showToast],
  );

  const removeMoment = useCallback(
    async (id: string) => {
      const snapshot = moments;
      setMoments((all) => all.filter((m) => m.id !== id));
      try {
        await apiDeleteMoment(id);
        showToast("Momento eliminado.");
      } catch (err) {
        setMoments(snapshot);
        showToast(mapApiError(err, "No se pudo eliminar el momento."));
      }
    },
    [moments, showToast],
  );

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
    setCurrentMomentIndex((v) =>
      filteredMoments.length ? (v + 1) % filteredMoments.length : 0,
    );
  }
  function previousMoment() {
    setCurrentMomentIndex((v) =>
      filteredMoments.length
        ? (v - 1 + filteredMoments.length) % filteredMoments.length
        : 0,
    );
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
    query,
    setQuery,
    sort,
    setSort,
    toast,
    setToast: showToast,
    submitting,
    viewMode,
    setViewMode,
    preferenceAsked,
    likeMoment: likeMomentAction,
    confirmMoment: confirmMomentAction,
    saveMoment: saveMomentAction,
    shareMoment: shareMomentAction,
    shareToFeed: shareToFeedAction,
    removeFromFeed: removeFromFeedAction,
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
  return (
    moment.stats.likes * 3 +
    moment.stats.confirmations * 4 +
    moment.stats.comments * 2 -
    hours * 5
  );
}
