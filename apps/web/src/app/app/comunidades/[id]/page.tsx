"use client";

import Link from "next/link";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, HttpClientError } from "@/lib/http-client";
import { PageState, PrimaryButton } from "@/components/ui";
import { CommunityHero } from "@/components/communities/detail/CommunityHero";
import { CommunityTabs } from "@/components/communities/detail/CommunityTabs";
import { CommunityComposer } from "@/components/communities/detail/CommunityComposer";
import { CommunityPostsPanel } from "@/components/communities/detail/CommunityPostsPanel";
import { CommunityMembersCard } from "@/components/communities/detail/CommunityMembersCard";
import { CommunityInviteCard } from "@/components/communities/detail/CommunityInviteCard";
import { CommunityRulesCard } from "@/components/communities/detail/CommunityRulesCard";
import { CommunityInfoPanel } from "@/components/communities/detail/CommunityInfoPanel";
import type { CommunityDetailModel } from "@/components/communities/detail/types";

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const communityId = Number(params.id);
  const { accessToken, isAuthenticated, setAccessToken } = useAccessToken();
  const [community, setCommunity] = useState<CommunityDetailModel | null>(null);
  const [posts, setPosts] = useState<Array<{ id: number; title: string; content: string }>>([]);
  const [activeTab, setActiveTab] = useState("inicio");
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const inviteUrl = useMemo(() => (typeof window === "undefined" ? "" : `${window.location.origin}/app/comunidades/${communityId}`), [communityId]);
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const copyLink = async (message: string) => { if (!inviteUrl) return; await navigator.clipboard.writeText(inviteUrl); showToast(message, "success"); };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [communityResponse, postsResponse] = await Promise.all([
        apiRequest<any>(`/communities/${communityId}`),
        apiRequest<{ items: Array<{ id: number; title: string; content: string }> }>(`/communities/${communityId}/posts?limit=10`),
      ]);
      setCommunity({
        id: communityResponse.id,
        name: communityResponse.name,
        description: communityResponse.description ?? "Espacio para compartir recursos, dudas y publicaciones académicas.",
        rules: (communityResponse.rules?.split("\n").filter(Boolean) ?? ["Ser respetuoso", "No spam ni autopromoción", "Mantener el contenido relevante"]).slice(0, 3),
        avatarUrl: communityResponse.avatarUrl,
        coverUrl: communityResponse.coverUrl,
        membersCount: communityResponse.membersCount ?? 1,
        postsCount: communityResponse.postsCount ?? postsResponse.items.length,
        createdAt: communityResponse.createdAt ? new Date(communityResponse.createdAt).toLocaleDateString("es-PE") : undefined,
        visibilityLabel: communityResponse.isPrivate ? "Privada" : "Pública",
        creatorName: communityResponse.creator?.firstName ?? "Creador",
      });
      setPosts(postsResponse.items ?? []);
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
    } finally { setLoading(false); }
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
    } finally { setJoining(false); }
  };

  useEffect(() => { if (!Number.isNaN(communityId)) void load(); }, [communityId, accessToken]);

  if (loading) return <PageState type="loading" title="Cargando comunidad…" description="Estamos preparando el espacio de tu comunidad." />;
  if (error || !community) return <PageState type="error" title="No encontramos esta comunidad." description="Es posible que no exista o ya no esté disponible." action={<PrimaryButton type="button"><Link href="/app/comunidades">Volver a comunidades</Link></PrimaryButton>} />;

  return <section className="space-y-4">{toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}<Link href="/app/comunidades" className="inline-flex text-sm font-semibold text-indigo-700">← Comunidades</Link><CommunityHero community={community} isCreator={isCreator} isMember={isMember} joining={joining} onJoin={onJoin} onShare={() => void copyLink("Enlace de comunidad copiado.")} onMenu={() => showToast("Función disponible próximamente.", "info")} /><CommunityTabs activeTab={activeTab} onChange={setActiveTab} showSettings={isCreator} />{activeTab === "inicio" ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4"><CommunityComposer onOpenPost={() => showToast("Crear publicación estará disponible pronto.", "info")} onOpenQuestion={() => showToast("Crear pregunta estará disponible pronto.", "info")} showToast={showToast} /><CommunityPostsPanel posts={posts} onCreatePost={() => showToast("Crear publicación estará disponible pronto.", "info")} /></div><div className="space-y-4"><CommunityMembersCard count={community.membersCount} creatorName={community.creatorName ?? "Creador"} /><CommunityInviteCard url={inviteUrl} onCopy={() => void copyLink("Enlace de invitación copiado.")} /><CommunityRulesCard rules={community.rules} /></div></div> : null}{activeTab === "publicaciones" ? <CommunityPostsPanel posts={posts} onCreatePost={() => showToast("Crear publicación estará disponible pronto.", "info")} /> : null}{activeTab === "miembros" ? <CommunityMembersCard count={community.membersCount} creatorName={community.creatorName ?? "Creador"} /> : null}{activeTab === "eventos" ? <div className="rounded-2xl border border-slate-200 bg-white p-6"><p>Aún no hay eventos programados.</p><button className="mt-3 rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700">Crear evento</button></div> : null}{activeTab === "archivos" ? <div className="rounded-2xl border border-slate-200 bg-white p-6"><p>Aún no hay archivos compartidos.</p><button className="mt-3 rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700">Compartir archivo</button></div> : null}{activeTab === "informacion" ? <CommunityInfoPanel community={community} /> : null}{activeTab === "configuracion" ? <div className="rounded-2xl border border-slate-200 bg-white p-6">Solo los administradores pueden configurar esta comunidad.</div> : null}</section>;
}
