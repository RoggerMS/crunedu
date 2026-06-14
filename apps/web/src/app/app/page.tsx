"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FeedComposer } from "@/components/feed/FeedComposer";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { FeedFilters, type FeedFilter } from "@/components/feed/FeedFilters";
import { FeedPostModal } from "@/components/feed/FeedPostModal";
import { PostCard } from "@/components/feed/PostCard";
import { RightSidebar } from "@/components/feed/RightSidebar";
import type { PostDraft, PostType } from "@/components/feed/types";
import { PrimaryButton, StatusMessage } from "@/components/ui";
import { saveMediaBlob } from "@/features/feed/feed-media-store";
import type { FeedAttachment } from "@/features/feed/feed.types";
import { useFeed } from "@/features/feed/useFeed";
import { uploadPostImage } from "@/lib/api-helpers";
import { HttpClientError } from "@/lib/http-client";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";

const DRAFTS_KEY = "crunedu_feed_drafts";
const REPORT_REASONS = ["Spam", "Contenido ofensivo", "Información falsa", "Acoso", "Otro"];

function publishErrorMessage(error: unknown): string {
  if (error instanceof HttpClientError) {
    const message = error.message.toLowerCase();
    if (error.status === 401) return "Tu sesión terminó. Vuelve a iniciar sesión para publicar.";
    if (error.status === 429) return "Has publicado varias veces seguidas. Espera un minuto e inténtalo de nuevo.";
    if (message.includes("comunidad")) return "Esa comunidad no está disponible. Puedes publicar en Feed general.";
    if (message.includes("contenido") || message.includes("corto")) {
      return "Tu mensaje es muy corto. Escribe un poco más o adjunta una imagen.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes("community")) return "Revisa la comunidad seleccionada o usa Feed general.";
    return error.message;
  }

  return "No pudimos publicar ahora. Inténtalo de nuevo en un momento.";
}

export default function AppPage() {
  const router = useRouter();
  const { communities } = useCommunities();
  const { isAuthenticated } = useAccessToken();
  const feed = useFeed();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType>("publicacion");
  const [filter, setFilter] = useState<FeedFilter>("para-ti");
  const [draftsCount, setDraftsCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => { setToast({ message, type }); setTimeout(() => setToast(null), 3200); };
  const handleReport = (postId: string) => { const menu = REPORT_REASONS.map((reason, index) => `${index + 1}. ${reason}`).join("\n"); const selected = window.prompt(`Selecciona motivo de reporte:\n${menu}`, "1"); const index = Number(selected) - 1; const reason = REPORT_REASONS[index] ?? REPORT_REASONS[4]; void feed.reportPost(postId, reason); showToast("Reporte enviado.", "success"); };
  const requireLogin = () => { showToast("Para publicar necesitas iniciar sesión.", "info"); router.push("/login?returnUrl=/app"); };

  const filteredPosts = filter === "recientes" ? [...feed.posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)) : filter === "siguiendo" ? feed.posts.filter((p) => p.destination.type === "community") : feed.posts;
  const activePost = activePostId ? feed.posts.find((post) => post.id === activePostId) ?? null : null;

  useEffect(() => { const params = new URLSearchParams(window.location.search); const postId = params.get("post"); if (postId) setActivePostId(postId); }, []);

  return <div className="relative mx-auto w-full max-w-[1500px] space-y-4 px-2 lg:px-4">
    {toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
    <CreatePostModal open={isOpen} initialType={selectedType} communities={communities} isAuthenticated={isAuthenticated} onClose={() => setIsOpen(false)} onToast={showToast} onRequireLogin={requireLogin}
      onSaveDraft={(data) => { const draft: PostDraft = { id: crypto.randomUUID(), type: data.type, title: data.title, content: data.content, courseName: data.courseName, stance: data.stance, deadline: data.deadline, visibility: data.visibility, communityId: data.communityId || undefined, tags: data.tags, createdAt: new Date().toISOString() }; const current = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]") as PostDraft[]; localStorage.setItem(DRAFTS_KEY, JSON.stringify([draft, ...current])); setDraftsCount(current.length + 1); showToast("Borrador guardado.", "success"); }}
      onSubmit={async (data) => {
        if (!isAuthenticated) {
          requireLogin();
          throw new Error("login required");
        }

        const trimmedContent = data.content.trim();
        if (!trimmedContent && data.attachedImages.length === 0) {
          showToast("Escribe un mensaje o adjunta una imagen para publicar.", "info");
          throw new Error("content required");
        }

        try {
          const attachments: FeedAttachment[] = [];
          for (const image of data.attachedImages) {
            const file = data.attachedFiles.find((item) => item.id === image.id)?.file;
            if (!file) continue;
            await saveMediaBlob(image.mediaId, file);
            const uploaded = await uploadPostImage(file);
            attachments.push({
              id: image.id,
              type: "image",
              name: file.name || "imagen",
              mimeType: uploaded.mimeType,
              size: uploaded.sizeBytes,
              previewUrl: uploaded.imageUrl,
              storageKey: uploaded.storageKey,
              apiImageUrl: uploaded.imageUrl,
            });
          }

          const community = data.communityId ? communities.find((item) => String(item.id) === data.communityId) : undefined;
          const destination = community
            ? { type: "community" as const, id: data.communityId, label: community.name }
            : { type: "general" as const, label: "Feed general" };

          await feed.createPost({
            content: trimmedContent || " ",
            communityId: data.communityId || undefined,
            attachments,
            destination,
            visibility: data.visibility === "comunidad" ? "community" : "public",
          });

          showToast("Listo, tu publicación ya está en el feed.", "success");
        } catch (error) {
          showToast(publishErrorMessage(error), "error");
          throw error;
        }
      }}
    />

    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-3">
        {!isAuthenticated ? <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900"><p className="font-bold">Inicia sesión para publicar</p><p className="mt-1">Puedes ver el feed sin cuenta. Para publicar, inicia sesión con tu correo de estudiante.</p><button className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white" onClick={requireLogin}>Ir a iniciar sesión</button></div> : null}
        <FeedComposer onOpen={(type) => { setSelectedType(type); setIsOpen(true); }} />
        <FeedFilters active={filter} onChange={setFilter} />
        {feed.loading ? <StatusMessage type="loading">Cargando publicaciones...</StatusMessage> : null}
        {feed.error ? <StatusMessage type="error">{feed.error}</StatusMessage> : null}
        {filteredPosts.map((post) => <PostCard key={post.id} post={post} onLike={(id) => void feed.likePost(id)} onSave={(id) => void feed.savePost(id)} onOpenPost={(id) => setActivePostId(id)} onShare={async (id) => { try { const shareUrl = `${window.location.origin}/app?post=${id}`; await navigator.clipboard.writeText(shareUrl); await feed.sharePost(id); showToast("Enlace copiado.", "success"); } catch { showToast("No se pudo copiar el enlace.", "error"); } }} onReport={handleReport} onHide={(id) => { void feed.hidePost(id); showToast("Publicación oculta.", "info"); }} onDelete={(id) => { void feed.deletePost(id); showToast("Publicación eliminada.", "success"); }} />)}
        {!feed.loading && !feed.error && filteredPosts.length === 0 ? <div className="rounded-2xl border bg-white p-6 text-center"><h3 className="text-xl font-black">Tu feed académico está listo para empezar</h3><p className="mt-2 text-sm text-slate-500">Publica en el feed o explora comunidades para descubrir contenido.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><PrimaryButton onClick={() => { setSelectedType("publicacion"); setIsOpen(true); }}>Crear publicación</PrimaryButton></div></div> : null}
      </section>
      <aside className="hidden self-start lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto overscroll-contain pr-1">
          <RightSidebar communities={communities} trends={[]} draftsCount={draftsCount} onJoin={() => showToast("Función de unirse a comunidad pendiente de conexión.", "info")} onOpenCreate={(type) => { setSelectedType(type); setIsOpen(true); }} />
        </div>
      </aside>
    </div>

    <FeedPostModal open={Boolean(activePost)} post={activePost} comments={activePost ? (feed.commentsByPost[activePost.id] ?? []) : []} onClose={() => setActivePostId(null)} onComment={(postId, content, parentId) => void feed.addComment(postId, content, parentId)} onLikePost={(postId) => void feed.likePost(postId)} onSavePost={(postId) => void feed.savePost(postId)} onSharePost={async (postId) => { const shareUrl = `${window.location.origin}/app?post=${postId}`; await navigator.clipboard.writeText(shareUrl); await feed.sharePost(postId); showToast("Enlace copiado.", "success"); }} onReportPost={handleReport} onHidePost={(postId) => { void feed.hidePost(postId); setActivePostId(null); }} onDeletePost={(postId) => { void feed.deletePost(postId); setActivePostId(null); }} onLikeComment={(postId, commentId) => void feed.likeComment(postId, commentId)} />
  </div>;
}
