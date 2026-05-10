"use client";

import type { CreateFeedPostPayload, CreatePostImagePayload, FeedPost } from "@crunedu/shared";
import { useMemo, useState } from "react";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { FeedFilters, type FeedFilter } from "@/components/feed/FeedFilters";
import { PostCard } from "@/components/feed/PostCard";
import { RightSidebar } from "@/components/feed/RightSidebar";
import type { LocalFeedPost, PostDraft, PostType } from "@/components/feed/types";
import { EmptyState, PrimaryButton, StatusMessage } from "@/components/ui";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";
import { apiRequest, mapApiError } from "@/lib/http-client";

const DRAFTS_KEY = "crunedu_post_drafts";

export default function AppPage() {
  const { communities } = useCommunities();
  const { posts, loading, error, reload } = usePosts();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType>("publicacion");
  const [filter, setFilter] = useState<FeedFilter>("para-ti");
  const [localPosts, setLocalPosts] = useState<LocalFeedPost[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const allPosts = useMemo(() => [...localPosts, ...posts], [localPosts, posts]);
  const filteredPosts = useMemo(() => {
    if (filter === "recientes") return [...allPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filter === "siguiendo") return [];
    return allPosts;
  }, [allPosts, filter]);

  const trends = useMemo(() => localPosts.flatMap((post) => post.tags).slice(0, 6), [localPosts]);

  function updateLocalPost(postId: string | number, updater: (post: LocalFeedPost) => LocalFeedPost) {
    setLocalPosts((prev) => prev.map((post) => (post.id === String(postId) ? updater(post) : post)));
  }

  return <div className="relative space-y-4">
    {toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
    <FeedComposer onOpen={(type) => { setSelectedType(type); setIsOpen(true); }} />
    <FeedFilters active={filter} onChange={(value) => { setFilter(value); if (value === "siguiendo") showToast("Aún no hay comunidades seguidas para filtrar.", "info"); }} />

    <CreatePostModal
      open={isOpen}
      initialType={selectedType}
      communities={communities}
      isAuthenticated={isAuthenticated}
      onClose={() => setIsOpen(false)}
      onToast={showToast}
      onSaveDraft={(data) => {
        const draft: PostDraft = { id: crypto.randomUUID(), type: data.type, title: data.title, content: data.content, visibility: data.visibility, communityId: data.communityId || undefined, tags: data.tags, createdAt: new Date().toISOString() };
        const current = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]") as PostDraft[];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify([draft, ...current]));
        showToast("Borrador guardado correctamente.", "success");
      }}
      onSubmit={async (data) => {
        const optimistic: LocalFeedPost = { id: `local-${Date.now()}`, type: data.type, title: data.title.trim() || undefined, content: data.content.trim(), authorName: "Tú", communityName: communities.find((c) => String(c.id) === data.communityId)?.name ?? "Feed general", createdAt: new Date().toISOString(), tags: data.tags, images: data.attachedImages.map((image) => ({ id: image.id, url: image.url })), files: data.attachedFiles, stats: { likes: 0, comments: 0, saves: 0 }, viewerState: { liked: false, saved: false }, commentsPreview: [] };
        setLocalPosts((prev) => [optimistic, ...prev]);
        setIsOpen(false);
        if (!accessToken) return showToast("Inicia sesión para publicar contenido.", "error");
        try {
          const uploadedImages: CreatePostImagePayload[] = [];
          const payload: CreateFeedPostPayload = { content: data.content.trim(), communityId: Number(data.communityId || 0) };
          if (data.communityId) payload.communityId = Number(data.communityId);
          for (const image of data.attachedImages) {
            if (image.uploaded) uploadedImages.push(image.uploaded);
          }
          if (uploadedImages.length) payload.images = uploadedImages;
          await apiRequest("/posts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
          await reload();
          showToast("¡Publicación realizada correctamente!", "success");
        } catch (err) {
          showToast(mapApiError(err, "No se pudo publicar en este momento."), "error");
        }
      }}
    />

    {loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}
    {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

    <div className="grid gap-4 xl:grid-cols-12">
      <section className="space-y-3 xl:col-span-8">
        {filteredPosts.map((post) => <PostCard key={post.id} post={post as FeedPost | LocalFeedPost} onLike={(id) => updateLocalPost(id, (current) => { const liked = !current.viewerState.liked; return { ...current, viewerState: { ...current.viewerState, liked }, stats: { ...current.stats, likes: Math.max(0, current.stats.likes + (liked ? 1 : -1)) } }; })} onSave={(id) => updateLocalPost(id, (current) => { const saved = !current.viewerState.saved; showToast(saved ? "Publicación guardada." : "Publicación quitada de guardados.", "success"); return { ...current, viewerState: { ...current.viewerState, saved }, stats: { ...current.stats, saves: Math.max(0, current.stats.saves + (saved ? 1 : -1)) } }; })} onComment={(id, comment) => updateLocalPost(id, (current) => ({ ...current, commentsPreview: [{ id: crypto.randomUUID(), authorName: "Tú", content: comment, createdAt: new Date().toISOString() }, ...(current.commentsPreview ?? [])], stats: { ...current.stats, comments: current.stats.comments + 1 } }))} onShare={async (id) => { try { await navigator.clipboard.writeText(`${window.location.origin}/app/posts/${id}`); showToast("Enlace copiado al portapapeles.", "success"); } catch { showToast("No se pudo copiar el enlace.", "error"); } }} />)}
        {!loading && !error && filteredPosts.length === 0 ? <EmptyState title="No hay publicaciones aún" description="Comienza creando tu primera publicación." action={<PrimaryButton onClick={() => { setSelectedType("publicacion"); setIsOpen(true); }}>Crear primera publicación</PrimaryButton>} /> : null}
      </section>
      <RightSidebar communities={communities} trends={trends} draftsCount={JSON.parse(typeof window !== "undefined" ? localStorage.getItem(DRAFTS_KEY) ?? "[]" : "[]").length} onJoin={() => showToast("Función de unirse a comunidad pendiente de conexión.", "info")} />
    </div>
  </div>;
}
