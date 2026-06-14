"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Lock, MoreHorizontal, Users } from "lucide-react";
import type { Community as ApiCommunity } from "@crunedu/shared";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { apiRequest } from "@/lib/http-client";
import { CommunityCardSkeleton } from "@/components/communities/CommunityCardSkeleton";

type Privacy = "publica" | "privada";
type CommunityStatus = "nueva" | "muy_activa" | "normal";
type ExploreFilter = "todas" | "mis" | "nuevas" | "activas" | "privadas" | "publicas";
type SortOption = "recientes" | "activas" | "az";
type TopView = "explorar" | "mis" | "publicaciones";

type CommunityCardModel = {
  id: number | string;
  name: string;
  description: string;
  cover: string;
  icon: string;
  tags: string[];
  membersCount: number;
  weeklyPosts: number;
  isMember: boolean;
  privacy: Privacy;
  status: CommunityStatus;
  createdAt: string;
  sampleMembers: string[];
};

const TAG_POOL = ["UNE", "Apoyo académico", "Trámites", "General", "Cursos"];

export default function CommunitiesPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const { communities: apiCommunities, loading, error, reload } = useCommunities();
  const [topView, setTopView] = useState<TopView>("explorar");
  const [filter, setFilter] = useState<ExploreFilter>("todas");
  const [sort, setSort] = useState<SortOption>("recientes");
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [requests, setRequests] = useState<Record<string, boolean>>({});
  const [joinedOverlay, setJoinedOverlay] = useState<Record<string, boolean>>(() => readBooleanMap("crunedu_joined_communities"));

  const mappedCommunities = useMemo(() => apiCommunities.map((community) => mapCommunityToCardModel(community, joinedOverlay)), [apiCommunities, joinedOverlay]);
  const communities = mappedCommunities;
  const showErrorState = !loading && Boolean(error);
  const showEmptyState = !loading && !error && communities.length === 0;

  const recommended = useMemo(() => [...communities].sort((a, b) => scoreCommunity(b) - scoreCommunity(a)), [communities]);

  const filtered = useMemo(() => {
    let list = [...communities];
    if (topView === "mis" || filter === "mis") list = list.filter((community) => community.isMember);
    if (filter === "nuevas") list = list.filter((community) => community.status === "nueva");
    if (filter === "activas") list = list.filter((community) => community.status === "muy_activa");
    if (filter === "privadas") list = list.filter((community) => community.privacy === "privada");
    if (filter === "publicas") list = list.filter((community) => community.privacy === "publica");
    if (sort === "recientes") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "activas") list.sort((a, b) => activityRatio(b) - activityRatio(a));
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [communities, filter, sort, topView]);

  const onJoin = async (community: CommunityCardModel) => {
    if (community.privacy === "privada") {
      setRequests((prev) => {
        const next = { ...prev, [String(community.id)]: true };
        persistBooleanMap("crunedu_community_requests", next);
        return next;
      });
      return;
    }
    if (!isAuthenticated || !accessToken) {
      router.push(`/login?returnUrl=/app/comunidades/${community.id}`);
      return;
    }
    await apiRequest(`/communities/${community.id}/join`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    setJoinedOverlay((prev) => {
      const next = { ...prev, [String(community.id)]: true };
      persistBooleanMap("crunedu_joined_communities", next);
      return next;
    });
    void reload();
  };

  return (
    <section className="mx-auto max-w-[1440px] space-y-4 px-4 pb-6 lg:px-6">
      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-700">Explora espacios por curso, carrera, trámite o interés académico.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => router.push("/app/comunidades/nueva")}>Crear comunidad</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => { setTopView("mis"); setFilter("mis"); }}>Mis comunidades</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setTopView("publicaciones")}>Publicaciones</button>
          </div>
        </div>
      </div>

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando comunidades...</div> : null}
      {showErrorState ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>No se pudieron cargar las comunidades.</p><button className="mt-3 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold" onClick={() => void reload()}>Reintentar</button></div> : null}
      {showEmptyState ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-sm text-slate-700">Aún no hay comunidades disponibles.</p><button className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => router.push("/app/comunidades/nueva")}>Crear comunidad</button></div> : null}

      {!showErrorState && !showEmptyState && (topView === "publicaciones" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Publicaciones de tus comunidades</h2><p className="mt-2 text-sm text-slate-600">Aún no hay publicaciones de tus comunidades.</p></div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-900">Recomendadas para ti</h2><p className="text-xs text-slate-500">Basadas en comunidades reales y actividad reciente.</p></div><button className="text-sm font-semibold text-indigo-600" onClick={() => setShowAllRecommended((prev) => !prev)}>{showAllRecommended ? "Volver a explorar" : "Ver más"}</button></div>
            <div className="flex gap-4 overflow-x-auto pb-1">{loading ? Array.from({ length: 4 }).map((_, index) => <CommunityCardSkeleton key={`recommended-skeleton-${index}`} compact />) : (showAllRecommended ? recommended : recommended.slice(0, 4)).map((community) => <div key={`recommended-${community.id}`} className="w-[280px] max-w-[320px] min-w-[260px] flex-shrink-0"><CommunityCard community={community} requestSent={Boolean(requests[String(community.id)])} onJoin={(community) => void onJoin(community)} onEnter={() => router.push(`/app/comunidades/${community.id}`)} /></div>)}</div>{!loading && !error && recommended.length === 0 ? <p className="mt-3 text-xs text-slate-500">Aún no hay recomendaciones disponibles.</p> : null}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><h2 className="text-base font-semibold text-slate-900">{topView === "mis" || filter === "mis" ? "Mis comunidades" : "Explorar comunidades"}</h2></div>
            <div className="mt-3 flex flex-wrap gap-2">{[["todas", "Todas"], ["mis", "Mis comunidades"], ["nuevas", "Nuevas"], ["activas", "Activas"], ["privadas", "Privadas"], ["publicas", "Públicas"]].map(([value, label]) => <button key={value} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => { setFilter(value as ExploreFilter); if (value !== "mis") setTopView("explorar"); }}>{label}</button>)}</div>
            <div className="mt-3"><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="recientes">Más recientes</option><option value="activas">Más activas</option><option value="az">Nombre A-Z</option></select></div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{loading ? Array.from({ length: 8 }).map((_, index) => <CommunityCardSkeleton key={`grid-skeleton-${index}`} />) : filtered.map((community) => <CommunityCard key={community.id} community={community} requestSent={Boolean(requests[String(community.id)])} onJoin={(community) => void onJoin(community)} onEnter={() => router.push(`/app/comunidades/${community.id}`)} />)}</div>
          </div>
        </>
      ))}
    </section>
  );
}

function mapCommunityToCardModel(apiCommunity: ApiCommunity, joinedOverlay: Record<string, boolean>): CommunityCardModel {
  const isMember = Boolean(joinedOverlay[String(apiCommunity.id)]);
  const isPrivate = apiCommunity.status.toLowerCase().includes("private") || apiCommunity.status.toLowerCase().includes("privada");
  return {
    id: apiCommunity.id,
    name: apiCommunity.name,
    description: apiCommunity.description ?? "Comunidad académica de CrunEdu.",
    cover: apiCommunity.coverUrl ? "from-indigo-200 via-violet-100 to-white" : "from-sky-200 via-indigo-100 to-white",
    icon: (apiCommunity.name.trim().charAt(0) || "C").toUpperCase(),
    tags: TAG_POOL.slice(0, 3),
    membersCount: apiCommunity.membersCount ?? 0,
    weeklyPosts: Math.min(apiCommunity.postsCount ?? 0, 99),
    isMember,
    privacy: isPrivate ? "privada" : "publica",
    status: getStatus(apiCommunity),
    createdAt: apiCommunity.createdAt,
    sampleMembers: ["CR", "UN", "ED"],
  };
}

function getStatus(community: ApiCommunity): CommunityStatus {
  if ((community.postsCount ?? 0) >= 15) return "muy_activa";
  const ageDays = Math.max(1, Math.floor((Date.now() - +new Date(community.createdAt)) / 86_400_000));
  if (ageDays <= 14) return "nueva";
  return "normal";
}

function scoreCommunity(community: CommunityCardModel) {
  const proportionalActivity = activityRatio(community);
  const hasRecentActivity = community.weeklyPosts > 0 ? 1 : 0;
  const freshnessBonus = recencyScore(community.createdAt);
  const newCommunityBonus = community.status === "nueva" ? 0.75 : 0;

  return proportionalActivity * 4 + hasRecentActivity * 1.5 + freshnessBonus + newCommunityBonus;
}

function recencyScore(createdAt: string) {
  const ageDays = Math.max(1, Math.floor((Date.now() - +new Date(createdAt)) / 86_400_000));
  if (ageDays <= 7) return 1;
  if (ageDays <= 30) return 0.5;
  return 0;
}

function activityRatio(community: CommunityCardModel) {
  return community.weeklyPosts / Math.max(community.membersCount, 1);
}

function readBooleanMap(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(key) ?? "{}"); } catch { return {}; }
}
function persistBooleanMap(key: string, value: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function CommunityCard({ community, requestSent, onJoin, onEnter }: { community: CommunityCardModel; requestSent: boolean; onJoin: (community: CommunityCardModel) => void; onEnter: () => void; }) {
  const action = community.isMember ? "Entrar" : community.privacy === "privada" ? (requestSent ? "Solicitud enviada" : "Solicitar acceso") : "Unirse";
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button onClick={onEnter} className={`h-16 w-full bg-gradient-to-r ${community.cover}`} /><div className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><button className="flex items-start gap-3 text-left" onClick={onEnter}><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">{community.icon}</div><div><h3 className="text-sm font-semibold text-slate-900">{community.name}</h3><p className="line-clamp-2 text-xs text-slate-600">{community.description}</p></div></button><button className="rounded-lg p-1 text-slate-500"><MoreHorizontal size={16} /></button></div><div className="flex items-center gap-3 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Users size={12} /> {community.membersCount}</span><span className="inline-flex items-center gap-1"><FileText size={12} /> {community.weeklyPosts} esta semana</span></div><button className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70" disabled={action === "Solicitud enviada"} onClick={() => (action === "Entrar" ? onEnter() : onJoin(community))}>{action}</button>{community.privacy === "privada" ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700"><Lock size={10} /> Privada</span> : null}</div></article>;
}
