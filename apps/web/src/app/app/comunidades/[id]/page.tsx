"use client";

import Link from "next/link";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, HttpClientError } from "@/lib/http-client";
import { uploadPostImage } from "@/lib/api-helpers";
import { PageState, PrimaryButton } from "@/components/ui";
import { CommunityHero } from "@/components/communities/detail/CommunityHero";
import { CommunityTabs } from "@/components/communities/detail/CommunityTabs";
import { CommunityComposer } from "@/components/communities/detail/CommunityComposer";
import { CommunityPostsPanel } from "@/components/communities/detail/CommunityPostsPanel";
import { CommunityMembersCard } from "@/components/communities/detail/CommunityMembersCard";
import { CommunityInviteCard } from "@/components/communities/detail/CommunityInviteCard";
import { CommunityRulesCard } from "@/components/communities/detail/CommunityRulesCard";
import { CommunityInfoPanel } from "@/components/communities/detail/CommunityInfoPanel";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import type { CommunityDetailModel, CommunityPostModel } from "@/components/communities/detail/types";
import type { CreatePostSubmitPayload, LocalAttachmentFile } from "@/components/feed/types";
import type { FeedAttachment } from "@/features/feed/feed.types";

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const communityId = Number(params.id);
  const { accessToken, isAuthenticated, setAccessToken } = useAccessToken();
  const [community, setCommunity] = useState<CommunityDetailModel | null>(null);
  const [posts, setPosts] = useState<CommunityPostModel[]>([]);
  const [activeTab, setActiveTab] = useState("inicio");
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
        authorName: [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ") || "Estudiante CrunEdu",
        authorAvatarUrl: post.author?.avatarUrl,
        authorRole: post.authorRole ?? "Miembro activo",
      })) as CommunityPostModel[];

      const members = Array.isArray(communityResponse.members)
        ? communityResponse.members.map((member: any, index: number) => ({
            id: member.id ?? index + 1,
            name: [member.firstName, member.lastName].filter(Boolean).join(" ") || member.name || "Miembro",
            avatarUrl: member.avatarUrl,
            status: member.status ?? (index < 2 ? "En línea" : `Hace ${index} hora${index === 1 ? "" : "s"}`),
          }))
        : [];

      setCommunity({
        id: communityResponse.id,
        name: communityResponse.name,
        description: communityResponse.description ?? "Espacio para compartir recursos, dudas y publicaciones académicas.",
        rules: (communityResponse.rules?.split("\n").filter(Boolean) ?? [
          "Sé respetuoso con todos los miembros.",
          "No se permite spam ni publicidad.",
          "Usa contenido relacionado con el curso.",
          "Ayuda y colabora con la comunidad.",
        ]).slice(0, 4),
        avatarUrl: communityResponse.avatarUrl,
        coverUrl: communityResponse.coverUrl,
        membersCount: communityResponse.membersCount ?? Math.max(members.length, 1),
        members,
        postsCount: communityResponse.postsCount ?? mappedPosts.length,
        visibilityLabel: communityResponse.isPrivate ? "Grupo privado" : "Grupo público",
        creatorName: communityResponse.creator?.firstName ?? "Creador",
        isPrivate: communityResponse.isPrivate ?? false,
      });
      setPosts(mappedPosts);

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

  if (loading) return <PageState type="loading" title="Cargando comunidad…" description="Estamos preparando el espacio de tu comunidad." />;
  if (error || !community) return <PageState type="error" title="No encontramos esta comunidad." description="Es posible que no exista o ya no esté disponible." action={<PrimaryButton type="button"><Link href="/app/comunidades">Volver a comunidades</Link></PrimaryButton>} />;

  const openQuestionFlow = () => {
    const params = new URLSearchParams({ communityId: String(communityId) });
    if (community?.name) params.set("communityName", community.name);
    router.push(`/app/preguntas/nuevo?${params.toString()}`);
  };

  return <main className="mx-auto w-full max-w-[1500px] space-y-4 px-2 py-2 md:px-4 md:py-4"><CreatePostModal open={postModalOpen} initialType="publicacion" communities={community ? [{ id: community.id, name: community.name }] : []} isAuthenticated={isAuthenticated} onClose={() => setPostModalOpen(false)} onRequireLogin={requireLogin} onToast={showToast} onSaveDraft={() => showToast("Los borradores de comunidad se guardarán desde el feed principal.", "info")} onSubmit={createCommunityPost} />{toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}<Link href="/app/comunidades" className="inline-flex text-sm font-semibold text-indigo-700">← Comunidades</Link><CommunityHero community={community} isCreator={isCreator} isMember={isMember} isPrivate={community.isPrivate} joining={joining} onJoin={onJoin} onInvite={() => showToast("Invitaciones próximamente.", "info")} onEdit={() => showToast("Configuración de comunidad próximamente.", "info")} onShare={() => void copyLink("Enlace copiado.")} onMenu={() => showToast(isCreator ? "Opciones de administración próximamente." : "Opciones de comunidad próximamente.", "info")} /><CommunityTabs activeTab={activeTab} onChange={setActiveTab} showSettings={isCreator} /><div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="min-w-0 space-y-4">{isMember || isCreator ? <CommunityComposer onOpenPost={() => setPostModalOpen(true)} onOpenQuestion={openQuestionFlow} showToast={showToast} /> : <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Únete a esta comunidad para publicar y participar.</div>}{activeTab !== "informacion" ? <CommunityPostsPanel posts={posts} onCreatePost={() => setPostModalOpen(true)} /> : <CommunityInfoPanel community={community} />}</section><aside className="space-y-4 xl:sticky xl:top-24 xl:self-start"><CommunityMembersCard count={community.membersCount} creatorName={community.creatorName ?? "Creador"} members={community.members} /><CommunityInviteCard url={inviteUrl} onCopy={() => void copyLink("Enlace copiado.")} onInvite={() => showToast("Invitaciones próximamente.", "info")} /><CommunityRulesCard rules={community.rules} /></aside></div></main>;
}
