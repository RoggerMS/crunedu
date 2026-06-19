"use client";

import Link from "next/link";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiRequest, HttpClientError } from "@/lib/http-client";
import { uploadPostImage } from "@/lib/api-helpers";
import { PageState, PrimaryButton } from "@/components/ui";
import { CommunityHero } from "@/components/communities/detail/CommunityHero";
import { CommunityTabs } from "@/components/communities/detail/CommunityTabs";
import { CommunityComposer } from "@/components/communities/detail/CommunityComposer";
import { CommunityPostsPanel } from "@/components/communities/detail/CommunityPostsPanel";
import { CommunityMembersCard } from "@/components/communities/detail/CommunityMembersCard";
import { CommunityRulesCard } from "@/components/communities/detail/CommunityRulesCard";
import { CommunityInfoPanel } from "@/components/communities/detail/CommunityInfoPanel";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import type { CommunityDetailModel, CommunityFileItem, CommunityMediaItem, CommunityPostModel } from "@/components/communities/detail/types";
import type { CreatePostSubmitPayload, LocalAttachmentFile } from "@/components/feed/types";
import type { FeedAttachment } from "@/features/feed/feed.types";

type CommunityMemberModel = { id: number; name: string; avatarUrl?: string | null; isCreator?: boolean };

const HIDDEN_POSTS_KEY = "crunedu_hidden_posts";
const REPORT_REASONS = ["Spam", "Contenido ofensivo", "Información falsa", "Acoso", "Otro"];

function readHiddenPostIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(HIDDEN_POSTS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}


function resolveApiImageUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) return imageUrl;
  if (imageUrl.startsWith("/api/")) return `${new URL(API_BASE_URL).origin}${imageUrl}`;
  if (imageUrl.startsWith("/")) return `${API_BASE_URL}${imageUrl}`;
  return `${API_BASE_URL}/${imageUrl}`;
}

function persistHiddenPostId(postId: number): void {
  if (typeof window === "undefined") return;
  const hidden = readHiddenPostIds();
  hidden.add(String(postId));
  window.localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify([...hidden]));
}

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const communityId = Number(params.id);
  const { accessToken, isAuthenticated, setAccessToken } = useAccessToken();
  const { user } = useAuth();
  const [community, setCommunity] = useState<CommunityDetailModel | null>(null);
  const [posts, setPosts] = useState<CommunityPostModel[]>([]);
  const [activeTab, setActiveTab] = useState("publicaciones");
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  const inviteUrl = useMemo(() => (typeof window === "undefined" ? "" : `${window.location.origin}/app/comunidades/${communityId}`), [communityId]);
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyLink = async (message: string) => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    showToast(message, "success");
  };
  const requireLogin = () => {
    showToast("Inicia sesión para participar en la comunidad.", "info");
    router.push(`/login?returnUrl=/app/comunidades/${communityId}`);
  };

  const authorInitial = (user?.firstName || user?.lastName || "U").trim().charAt(0).toUpperCase() || "U";

  async function createCommunityPost(data: CreatePostSubmitPayload) {
    if (!isAuthenticated || !accessToken) return requireLogin();
    const trimmedContent = data.content.trim();
    if (!trimmedContent && data.attachedImages.length === 0) {
      showToast("Escribe un mensaje o adjunta una imagen para publicar.", "info");
      return;
    }

    const attachments: FeedAttachment[] = [];
    for (const image of data.attachedImages) {
      const file = data.attachedFiles.find((item: LocalAttachmentFile) => item.id === image.id)?.file;
      if (!file) continue;
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

    await apiRequest("/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        content: trimmedContent || " ",
        communityId,
        images: attachments.map((attachment) => ({
          imageUrl: attachment.apiImageUrl,
          storageKey: attachment.storageKey,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.size,
        })),
      }),
    });
    setPostModalOpen(false);
    showToast("Publicación creada en la comunidad.", "success");
    await load();
  }

  function buildMemberList(communityResponse: any): { members: CommunityMemberModel[]; creatorName: string; creatorAvatarUrl: string | null } {
    const creator = communityResponse.creator ?? null;
    const creatorName = [creator?.firstName, creator?.lastName].filter(Boolean).join(" ").trim() || "Creador";
    const creatorAvatarUrl = creator?.avatarUrl ?? null;

    const apiMembers: CommunityMemberModel[] = Array.isArray(communityResponse.members)
      ? communityResponse.members.map((member: any, index: number) => ({
          id: member.id ?? index + 1,
          name: [member.firstName, member.lastName].filter(Boolean).join(" ").trim() || "Miembro",
          avatarUrl: member.avatarUrl ?? null,
          isCreator: Boolean(member.isCreator),
        }))
      : [];

    const creatorAlreadyListed = apiMembers.some((member) => member.isCreator);
    if (!creatorAlreadyListed && creator) {
      return {
        members: [{ id: creator.id ? -creator.id : -1, name: creatorName, avatarUrl: creatorAvatarUrl, isCreator: true }, ...apiMembers],
        creatorName,
        creatorAvatarUrl,
      };
    }
    return { members: apiMembers, creatorName, creatorAvatarUrl };
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [communityResponse, postsResponse] = await Promise.all([
        apiRequest<any>(`/communities/${communityId}`),
        apiRequest<{ items?: any[] }>(`/communities/${communityId}/posts?limit=10`),
      ]);

      const mappedPosts = (postsResponse.items ?? []).map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt ? new Date(post.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Hace poco",
        authorId: post.author?.id,
        authorName: [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ").trim() || "Estudiante CrunEdu",
        authorAvatarUrl: post.author?.avatarUrl ?? null,
        likes: 0,
        commentsCount: post.commentsCount ?? 0,
        saves: 0,
        liked: false,
        saved: false,
        isMine: Boolean(post.isMine || (user && post.author?.id === user.id)),
        images: Array.isArray(post.images) ? post.images.map((image: any) => ({
          id: image.id,
          imageUrl: resolveApiImageUrl(image.imageUrl),
          mimeType: image.mimeType,
          sizeBytes: image.sizeBytes,
        })) : [],
      })) as CommunityPostModel[];

      const hiddenIds = readHiddenPostIds();
      const visiblePosts = hiddenIds.size > 0 ? mappedPosts.filter((post) => !hiddenIds.has(String(post.id))) : mappedPosts;

      const { members, creatorName, creatorAvatarUrl } = buildMemberList(communityResponse);

      setCommunity({
        id: communityResponse.id,
        name: communityResponse.name,
        description: communityResponse.description?.trim() || "Esta comunidad aún no tiene una descripción.",
        rules: communityResponse.rules ? communityResponse.rules.split("\n").map((r: string) => r.trim()).filter(Boolean) : [],
        avatarUrl: communityResponse.avatarUrl,
        coverUrl: communityResponse.coverUrl,
        membersCount: communityResponse.membersCount ?? Math.max(members.length, 1),
        members,
        postsCount: communityResponse.postsCount ?? mappedPosts.length,
        visibilityLabel: communityResponse.isPrivate ? "Grupo privado" : "Grupo público",
        createdAt: communityResponse.createdAt ? new Date(communityResponse.createdAt).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" }) : "No disponible",
        creatorName,
        creatorAvatarUrl,
        isPrivate: communityResponse.isPrivate ?? false,
      });
      setPosts(visiblePosts);

      if (isAuthenticated && accessToken) {
        try {
          const membership = await apiRequest<{ isJoined: boolean; isCreator: boolean }>(`/communities/${communityId}/membership`, { headers: { Authorization: `Bearer ${accessToken}` } });
          setIsMember(membership.isJoined);
          setIsCreator(membership.isCreator);
        } catch (membershipError) {
          if (membershipError instanceof HttpClientError && membershipError.status === 401) {
            setAccessToken("");
            showToast("Tu sesión expiró. Inicia sesión nuevamente.", "error");
            setIsMember(false);
            setIsCreator(false);
          }
        }
      }
    } catch {
      setError("No encontramos esta comunidad.");
    } finally {
      setLoading(false);
    }
  }

  const onJoin = async () => {
    if (!isAuthenticated || !accessToken) return showToast("Inicia sesión para unirte a una comunidad.", "info");
    try {
      setJoining(true);
      await apiRequest(`/communities/${communityId}/join`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
      setIsMember(true);
      setCommunity((prev) => (prev ? { ...prev, membersCount: prev.membersCount + 1 } : prev));
      showToast("Te uniste a la comunidad.", "success");
    } catch (joinError) {
      if (joinError instanceof HttpClientError && joinError.status === 401) {
        setAccessToken("");
        showToast("Tu sesión expiró. Inicia sesión nuevamente.", "error");
      } else showToast("No se pudo completar la acción. Inténtalo nuevamente.", "error");
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(communityId)) void load();
  }, [communityId, accessToken]);

  const handleLikePost = (postId: number) => {
    setPosts((prev) => prev.map((post) => {
      if (post.id !== postId) return post;
      const liked = !post.liked;
      return { ...post, liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) };
    }));
    const target = posts.find((post) => post.id === postId);
    showToast(target?.liked ? "Me gusta quitado." : "Me gusta registrado.", "info");
  };

  const handleSavePost = (postId: number) => {
    setPosts((prev) => prev.map((post) => {
      if (post.id !== postId) return post;
      const saved = !post.saved;
      return { ...post, saved, saves: Math.max(0, post.saves + (saved ? 1 : -1)) };
    }));
    const target = posts.find((post) => post.id === postId);
    showToast(target?.saved ? "Guardado quitado." : "Publicación guardada.", "info");
  };

  const handleCommentPost = (postId: number) => {
    router.push(`/app?post=${postId}`);
  };

  const handleSharePost = async (postId: number) => {
    try {
      const shareUrl = `${window.location.origin}/app?post=${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Enlace copiado.", "success");
    } catch {
      showToast("No se pudo copiar el enlace.", "error");
    }
  };

  const handleReportPost = async (postId: number) => {
    if (!isAuthenticated || !accessToken) return requireLogin();
    const menu = REPORT_REASONS.map((reason, index) => `${index + 1}. ${reason}`).join("\n");
    const selected = window.prompt(`Selecciona motivo de reporte:\n${menu}`, "1");
    if (!selected) return;
    const index = Number(selected) - 1;
    const reason = REPORT_REASONS[index] ?? REPORT_REASONS[4];
    try {
      await apiRequest("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ targetType: "POST", targetId: postId, reason }),
      });
      showToast("Reporte enviado.", "success");
    } catch (reportError) {
      if (reportError instanceof HttpClientError && reportError.status === 401) {
        setAccessToken("");
        showToast("Tu sesión expiró. Inicia sesión nuevamente.", "error");
      } else {
        showToast("No se pudo enviar el reporte. Inténtalo nuevamente.", "error");
      }
    }
  };

  const handleHidePost = (postId: number) => {
    persistHiddenPostId(postId);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    showToast("Publicación oculta.", "info");
  };


  const handleEditPost = async (post: CommunityPostModel) => {
    if (!post.isMine) return;
    const nextTitle = window.prompt("Editar título (opcional):", post.title ?? "") ?? post.title ?? "";
    const nextContent = window.prompt("Editar contenido de la publicación:", post.content);
    if (nextContent === null) return;
    const trimmedContent = nextContent.trim();
    if (!trimmedContent) { showToast("La publicación no puede quedar vacía.", "info"); return; }
    if (!isAuthenticated || !accessToken) return requireLogin();
    try {
      const updated = await apiRequest<any>(`/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title: nextTitle.trim() || undefined, content: trimmedContent, communityId }) });
      setPosts((prev) => prev.map((item) => item.id === post.id ? { ...item, title: updated.title, content: updated.content } : item));
      showToast("Publicación actualizada.", "success");
    } catch {
      showToast("No se pudo actualizar la publicación.", "error");
    }
  };

  const mediaItems = useMemo<CommunityMediaItem[]>(() => posts.flatMap((post) => (post.images ?? []).map((image, index) => ({
    id: `${post.id}-${image.id ?? index}`,
    postId: post.id,
    imageUrl: image.imageUrl,
    alt: `Imagen compartida en ${community?.name ?? "la comunidad"}`,
    authorName: post.authorName,
    createdAt: post.createdAt,
  }))), [posts, community?.name]);

  const fileItems = useMemo<CommunityFileItem[]>(() => [], []);

  const handleDeletePost = async (postId: number) => {
    if (!isAuthenticated || !accessToken) return requireLogin();
    try {
      await apiRequest(`/posts/${postId}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      showToast("Publicación eliminada.", "success");
    } catch (deleteError) {
      if (deleteError instanceof HttpClientError && deleteError.status === 401) {
        setAccessToken("");
        showToast("Tu sesión expiró. Inicia sesión nuevamente.", "error");
      } else {
        showToast("No se pudo eliminar la publicación.", "error");
      }
    }
  };

  if (loading) return <PageState type="loading" title="Cargando comunidad…" description="Estamos preparando el espacio de tu comunidad." />;
  if (error || !community) return <PageState type="error" title="No encontramos esta comunidad." description="Es posible que no exista o ya no esté disponible." action={<PrimaryButton type="button"><Link href="/app/comunidades">Volver a comunidades</Link></PrimaryButton>} />;

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-4 px-2 py-2 md:px-4 md:py-4">
      <CreatePostModal
        open={postModalOpen}
        initialType="publicacion"
        mode="community"
        lockedCommunityName={community.name}
        communities={community ? [{ id: community.id, name: community.name }] : []}
        isAuthenticated={isAuthenticated}
        onClose={() => setPostModalOpen(false)}
        onRequireLogin={requireLogin}
        onToast={showToast}
        onSaveDraft={() => undefined}
        onSubmit={createCommunityPost}
      />
      {toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
      <Link href="/app/comunidades" className="inline-flex text-sm font-semibold text-indigo-700">← Comunidades</Link>
      <CommunityHero
        community={community}
        isCreator={isCreator}
        isMember={isMember}
        isPrivate={community.isPrivate}
        joining={joining}
        onJoin={onJoin}
        onShare={() => void copyLink("Enlace copiado.")}
        onCopyLink={() => void copyLink("Enlace copiado.")}
        onManageMembers={() => setActiveTab("miembros")}
      />
      <CommunityTabs activeTab={activeTab} onChange={setActiveTab} showSettings={isCreator} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          {activeTab === "informacion" ? (
            <CommunityInfoPanel community={community} />
          ) : activeTab === "miembros" ? (
            <CommunityMembersView members={community.members ?? []} count={community.membersCount} />
          ) : activeTab === "multimedia" ? (
            <CommunityMultimediaView items={mediaItems} onOpenPost={handleCommentPost} />
          ) : activeTab === "archivos" ? (
            <CommunityFilesView items={fileItems} />
          ) : (
            <>
              {isMember || isCreator ? (
                <CommunityComposer
                  onOpenPost={() => setPostModalOpen(true)}
                  authorInitial={authorInitial}
                  authorAvatarUrl={user?.avatarUrl ?? null}
                  authorName={user ? `${user.firstName} ${user.lastName}`.trim() : undefined}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Únete a esta comunidad para publicar y participar.</div>
              )}
              <CommunityPostsPanel
                posts={posts}
                onCreatePost={() => setPostModalOpen(true)}
                onLike={handleLikePost}
                onComment={handleCommentPost}
                onSave={handleSavePost}
                onShare={handleSharePost}
                onReport={handleReportPost}
                onHide={handleHidePost}
                onDelete={handleDeletePost}
                onEdit={handleEditPost}
              />
            </>
          )}
        </section>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <CommunityMembersCard count={community.membersCount} members={community.members} />
          <CommunityRulesCard rules={community.rules} />
        </aside>
      </div>
    </main>
  );
}

function CommunityMultimediaView({ items, onOpenPost }: { items: CommunityMediaItem[]; onOpenPost: (postId: number) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">Multimedia</h2>
        <p className="text-sm text-slate-500">Imágenes compartidas en publicaciones reales de esta comunidad.</p>
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => onOpenPost(item.postId)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left">
              <img src={item.imageUrl} alt={item.alt} className="aspect-square w-full object-cover transition group-hover:scale-105" />
              <div className="space-y-0.5 p-2">
                <p className="truncate text-xs font-semibold text-slate-800">{item.authorName ?? "Estudiante CrunEdu"}</p>
                <p className="text-[11px] text-slate-500">{item.createdAt ?? "Hace poco"}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <h3 className="font-bold text-slate-900">Aún no hay multimedia</h3>
          <p className="mt-1 text-sm text-slate-600">Las imágenes compartidas en publicaciones aparecerán aquí cuando existan datos reales.</p>
        </div>
      )}
    </section>
  );
}

function CommunityFilesView({ items }: { items: CommunityFileItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">Archivos</h2>
        <p className="text-sm text-slate-500">Aquí se ordenarán documentos vinculados con Apuntes y Preguntas.</p>
      </div>
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">{item.source} · {item.createdAt ?? "Fecha no disponible"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <h3 className="font-bold text-slate-900">Aún no hay archivos</h3>
          <p className="mt-1 text-sm text-slate-600">Cuando Preguntas o Apuntes compartan documentos reales con esta comunidad, aparecerán en esta sección.</p>
        </div>
      )}
    </section>
  );
}

function CommunityMembersView({ members, count }: { members: CommunityMemberModel[]; count: number }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Miembros</h2>
        <span className="text-sm text-slate-500">{count} {count === 1 ? "miembro" : "miembros"}</span>
      </div>
      {members.length ? (
        <ul className="divide-y divide-slate-100">
          {members.map((member) => {
            const initial = member.name.trim().charAt(0).toUpperCase() || "U";
            return (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">{initial}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                  {member.isCreator ? <span className="text-xs font-semibold text-indigo-600">Creador</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">La lista de miembros estará disponible cuando la comunidad tenga actividad real.</p>
      )}
    </section>
  );
}
