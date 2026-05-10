"use client";

import { useAccessToken } from "@/hooks/useAccessToken";
import { useCommunities } from "@/hooks/useCommunities";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mapApiError } from "@/lib/http-client";
import { PageState, PrimaryButton } from "@/components/ui";
import { CommunitiesHeader } from "@/components/communities/CommunitiesHeader";
import { CommunityFilters } from "@/components/communities/CommunityFilters";
import { CommunityGrid } from "@/components/communities/CommunityGrid";
import { CommunitiesSidebar } from "@/components/communities/CommunitiesSidebar";
import { CommunityEmptyState } from "@/components/communities/CommunityEmptyState";
import { CommunityFilter, CommunitySort, CommunityViewModel, toCommunityViewModel, type CommunityCategory } from "@/components/communities/types";

const PAGE_SIZE = 8;

export default function Page() {
  const { communities, loading, error, reload } = useCommunities();
  const { isAuthenticated } = useAccessToken();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<CommunityFilter>("todas");
  const [sort, setSort] = useState<CommunitySort>("mas-recientes");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [joinedMap, setJoinedMap] = useState<Record<string | number, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const viewModels = useMemo(() => communities.map(toCommunityViewModel).map((item) => ({ ...item, isMember: joinedMap[item.id] ?? item.isMember })), [communities, joinedMap]);

  const filtered = useMemo(() => {
    let items = [...viewModels];
    const query = search.trim().toLowerCase();
    if (query) {
      items = items.filter((item) => [item.name, item.description ?? "", item.category].join(" ").toLowerCase().includes(query));
    }
    if (activeFilter === "mis-comunidades") items = items.filter((item) => item.isMember);
    if (["carreras", "cursos", "tramites", "debates"].includes(activeFilter)) items = items.filter((item) => item.category === activeFilter);
    if (activeFilter === "mas-activas") items.sort((a, b) => b.postCount + b.memberCount - (a.postCount + a.memberCount));
    if (activeFilter === "nuevas") items.sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
    if (sort === "mas-recientes") items.sort((a, b) => byDateDesc(a.updatedAt ?? a.createdAt, b.updatedAt ?? b.createdAt));
    if (sort === "mas-antiguas") items.sort((a, b) => byDateAsc(a.updatedAt ?? a.createdAt, b.updatedAt ?? b.createdAt));
    return items;
  }, [viewModels, search, activeFilter, sort]);

  const visibleCommunities = filtered.slice(0, visibleCount);

  const stats = useMemo(() => ({ communities: viewModels.length, members: viewModels.reduce((acc, item) => acc + item.memberCount, 0), postsThisWeek: Math.max(0, viewModels.reduce((acc, item) => acc + item.postCount, 0)) }), [viewModels]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onCreateCommunity = () => router.push(`/app/comunidades/nueva${search ? `?name=${encodeURIComponent(search)}` : ""}`);

  const onJoin = (community: CommunityViewModel) => {
    setJoinedMap((prev) => ({ ...prev, [community.id]: true }));
    showToast(community.isPrivate ? "Solicitud enviada correctamente." : "Te uniste a la comunidad.", "success");
  };

  if (loading) return <PageState type="loading" title="Cargando comunidades" description="Estamos preparando tus comunidades disponibles." />;
  if (error) return <PageState type="error" title="No pudimos cargar las comunidades" description={mapApiError(error, "No se pudieron cargar las comunidades.")} action={<PrimaryButton type="button" onClick={() => void reload()}>Reintentar</PrimaryButton>} />;

  return (
    <section className="space-y-4">
      {toast ? <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <CommunitiesHeader search={search} onSearchChange={setSearch} onCreateCommunity={onCreateCommunity} stats={stats} />
          <CommunityFilters activeFilter={activeFilter} onFilterChange={(filter) => { setActiveFilter(filter); setVisibleCount(PAGE_SIZE); }} sort={sort} onSortChange={setSort} />
          <p className="text-sm text-slate-600">{filtered.length} comunidades encontradas</p>

          {viewModels.length === 0 ? <CommunityEmptyState onCreateCommunity={onCreateCommunity} onExploreCategories={() => setActiveFilter("carreras")} /> : filtered.length === 0 ? <CommunityEmptyState onCreateCommunity={onCreateCommunity} onExploreCategories={() => setActiveFilter("todas")} /> : <><CommunityGrid communities={visibleCommunities} onJoin={onJoin} /><div className="flex justify-center"><button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => { if (visibleCount >= filtered.length) return showToast("Ya estás viendo todas las comunidades disponibles.", "info"); setVisibleCount((current) => current + PAGE_SIZE); }}>Ver más comunidades</button></div></>}
        </main>
        <CommunitiesSidebar communities={viewModels} onJoin={onJoin} onCategoryFilter={(category) => setActiveFilter(mapCategoryToFilter(category))} />
      </div>

      {!isAuthenticated ? <p className="text-xs text-slate-500">Inicia sesión para unirte y crear comunidades.</p> : null}
    </section>
  );
}

function byDateDesc(a?: string, b?: string) { return toDateNumber(b) - toDateNumber(a); }
function byDateAsc(a?: string, b?: string) { return toDateNumber(a) - toDateNumber(b); }
function toDateNumber(value?: string) { return value ? new Date(value).getTime() : 0; }
function mapCategoryToFilter(category: CommunityCategory): CommunityFilter {
  if (category === "carreras" || category === "cursos" || category === "tramites" || category === "debates") return category;
  return "todas";
}
