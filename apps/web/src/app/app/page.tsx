"use client";

import type { CreateFeedPostPayload, FeedPost } from "@crunedu/shared";
import { useEffect, useMemo, useState } from "react";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { FeedFilters, type FeedFilter } from "@/components/feed/FeedFilters";
import { PostCard } from "@/components/feed/PostCard";
import { RightSidebar } from "@/components/feed/RightSidebar";
import type { FeedComment, FeedCommentsByPost } from "@/lib/feed-storage";
import { appendFeedEvent, deleteFeedPost, FEED_STORAGE_KEYS, loadFeedComments, loadFeedPosts, loadFeedState, saveFeedComments, saveFeedPosts, saveFeedState } from "@/lib/feed-storage";
import { saveMediaBlob } from "@/lib/feed-media-store";
import type { LocalFeedPost, PostDraft, PostType } from "@/components/feed/types";
import { PrimaryButton, StatusMessage } from "@/components/ui";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";
import { apiRequest } from "@/lib/http-client";

const DRAFTS_KEY = "crunedu_feed_drafts";

export default function AppPage() {
  const { communities } = useCommunities(); const { posts, loading, error, reload } = usePosts(); const { accessToken, isAuthenticated } = useAccessToken();
  const [isOpen, setIsOpen] = useState(false); const [selectedType, setSelectedType] = useState<PostType>("publicacion"); const [filter, setFilter] = useState<FeedFilter>("para-ti");
  const [localPosts, setLocalPosts] = useState<LocalFeedPost[]>([]); const [commentsByPost, setCommentsByPost] = useState<FeedCommentsByPost>({}); const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [draftsCount, setDraftsCount] = useState(0); const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => { setToast({ message, type }); setTimeout(() => setToast(null), 3200); };
  useEffect(() => {
    setDraftsCount(JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]").length);
    try { setLocalPosts(loadFeedPosts()); } catch { showToast("Se limpiaron publicaciones locales dañadas.", "info"); }
    setCommentsByPost(loadFeedComments()); setHiddenPostIds(loadFeedState().hiddenPostIds);
  }, []);
  useEffect(() => { const res = saveFeedPosts(localPosts); if (!res.ok && res.quota) showToast("No pudimos guardar archivos pesados localmente. Las imágenes se sincronizarán cuando el backend esté listo.", "info"); }, [localPosts]);
  useEffect(() => { saveFeedComments(commentsByPost); }, [commentsByPost]);
  useEffect(() => { saveFeedState({ hiddenPostIds }); }, [hiddenPostIds]);

  const allPosts = useMemo(() => [...localPosts, ...posts].filter((post) => !hiddenPostIds.includes(String(post.id))), [localPosts, posts, hiddenPostIds]);
  const filteredPosts = useMemo(() => filter === "recientes" ? [...allPosts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) : filter === "siguiendo" ? allPosts.filter((p) => "communityName" in p && Boolean(p.communityName)) : allPosts, [allPosts, filter]);

  function updateLocalPost(postId: string | number, updater: (post: LocalFeedPost) => LocalFeedPost) { setLocalPosts((prev) => prev.map((post) => (post.id === String(postId) ? updater(post) : post))); }

  return <div className="relative space-y-4">
    {toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
    <FeedComposer onOpen={(type) => { setSelectedType(type); setIsOpen(true); }} />
    <FeedFilters active={filter} onChange={setFilter} />
    <CreatePostModal open={isOpen} initialType={selectedType} communities={communities} isAuthenticated={isAuthenticated} onClose={() => setIsOpen(false)} onToast={showToast}
      onSaveDraft={(data) => { const draft: PostDraft = { id: crypto.randomUUID(), type: data.type, title: data.title, content: data.content, courseName: data.courseName, stance: data.stance, deadline: data.deadline, visibility: data.visibility, communityId: data.communityId || undefined, tags: data.tags, createdAt: new Date().toISOString() }; const current = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]") as PostDraft[]; localStorage.setItem(DRAFTS_KEY, JSON.stringify([draft, ...current])); setDraftsCount(current.length + 1); showToast("Borrador guardado.", "success"); }}
      onSubmit={async (data) => {
        if (!data.content.trim() && data.attachedImages.length === 0) return showToast("Agrega texto o una imagen para publicar.", "error");
        const localId = `local-${Date.now()}`;
        for (const image of data.attachedImages) { const file = data.attachedFiles.find((f) => f.id === image.id)?.file; if (file) await saveMediaBlob(image.mediaId, file); }
        const optimistic: LocalFeedPost = { id: localId, type: data.type, title: data.title.trim() || undefined, content: data.content.trim(), authorName: "Tú", communityName: communities.find((c) => String(c.id) === data.communityId)?.name ?? "Feed general", createdAt: new Date().toISOString(), tags: data.tags, attachedFiles: [], attachedImages: data.attachedImages.map((i) => ({ id: i.id, mediaId: i.mediaId, previewUrl: i.previewUrl })), images: data.attachedImages.map((i) => ({ id: i.id, mediaId: i.mediaId, previewUrl: i.previewUrl })), stats: { likes: 0, comments: 0, saves: 0 }, viewerState: { liked: false, saved: false }, commentsPreview: [] };
        setLocalPosts((prev) => [optimistic, ...prev]); appendFeedEvent({ type: "create_post", id: localId, date: new Date().toISOString() }); setIsOpen(false); showToast("Publicación creada.", "success");
        if (!accessToken) return;
        try { const payload: CreateFeedPostPayload = { content: data.content.trim(), communityId: data.communityId ? Number(data.communityId) : 1 }; await apiRequest("/posts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) }); await reload(); } catch {}
      }} />
    {loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}
    {error ? <StatusMessage type="error">{error}</StatusMessage> : null}
    <div className="grid gap-4 xl:grid-cols-12"><section className="space-y-3 xl:col-span-8">
      {filteredPosts.map((post) => <PostCard key={post.id} post={post as FeedPost | LocalFeedPost} comments={commentsByPost[String(post.id)] ?? []}
        onLike={(id) => updateLocalPost(id, (current) => { const liked = !current.viewerState.liked; appendFeedEvent({ type: "like", id, date: new Date().toISOString() }); return { ...current, viewerState: { ...current.viewerState, liked }, stats: { ...current.stats, likes: Math.max(0, current.stats.likes + (liked ? 1 : -1)) } }; })}
        onSave={(id) => updateLocalPost(id, (current) => { const saved = !current.viewerState.saved; appendFeedEvent({ type: "save", id, date: new Date().toISOString() }); return { ...current, viewerState: { ...current.viewerState, saved }, stats: { ...current.stats, saves: Math.max(0, current.stats.saves + (saved ? 1 : -1)) } }; })}
        onComment={(id, content) => { const c: FeedComment = { id: crypto.randomUUID(), author: { id: "me", name: "Tú" }, content, createdAt: new Date().toISOString() }; setCommentsByPost((prev) => ({ ...prev, [String(id)]: [c, ...(prev[String(id)] ?? [])] })); appendFeedEvent({ type: "comment", id, date: c.createdAt }); updateLocalPost(id, (current) => ({ ...current, stats: { ...current.stats, comments: current.stats.comments + 1 } })); }}
        onShare={async (id) => { try { await navigator.clipboard.writeText(`${window.location.origin}/app/posts/${id}`); appendFeedEvent({ type: "share", id, date: new Date().toISOString() }); showToast("Enlace copiado", "success"); } catch { showToast("No se pudo copiar el enlace.", "error"); } }}
        onReport={(id, reason) => { const current = JSON.parse(localStorage.getItem(FEED_STORAGE_KEYS.reports) ?? "[]"); localStorage.setItem(FEED_STORAGE_KEYS.reports, JSON.stringify([{ id, reason, createdAt: new Date().toISOString() }, ...current])); appendFeedEvent({ type: "report", id, date: new Date().toISOString() }); showToast("Reporte enviado.", "success"); }}
        onHide={(id) => { setHiddenPostIds((prev) => [...new Set([...prev, String(id)])]); appendFeedEvent({ type: "hide", id, date: new Date().toISOString() }); showToast("Publicación oculta.", "info"); }}
        onDelete={(id) => { setLocalPosts((prev) => prev.filter((post) => post.id !== String(id))); deleteFeedPost(String(id)); appendFeedEvent({ type: "delete", id, date: new Date().toISOString() }); showToast("Publicación eliminada.", "success"); }}
      />)}
      {!loading && !error && filteredPosts.length === 0 ? <div className="rounded-2xl border bg-white p-6 text-center"><h3 className="text-xl font-black">Tu feed académico está listo para empezar</h3><p className="mt-2 text-sm text-slate-500">Publica en el feed o explora comunidades para descubrir contenido.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><PrimaryButton onClick={() => { setSelectedType("publicacion"); setIsOpen(true); }}>Crear publicación</PrimaryButton></div></div> : null}
    </section><RightSidebar communities={communities} trends={[]} draftsCount={draftsCount} onJoin={() => showToast("Función de unirse a comunidad pendiente de conexión.", "info")} onOpenCreate={(type) => { setSelectedType(type); setIsOpen(true); }} /></div>
  </div>;
}
