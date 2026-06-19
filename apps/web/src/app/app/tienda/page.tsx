"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Plus, Heart, MessageCircle, Package, Eye } from "lucide-react";
import { StoreAcademicRadar } from "@/components/store/StoreAcademicRadar";
import { StoreEmptyState } from "@/components/store/StoreEmptyState";
import { StoreFilters } from "@/components/store/StoreFilters";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreListingGrid } from "@/components/store/StoreListingGrid";
import { StoreLoadingState } from "@/components/store/StoreLoadingState";
import { StoreNeedShortcuts } from "@/components/store/StoreNeedShortcuts";
import { StoreReportModal } from "@/components/store/StoreReportModal";
import { StoreSection } from "@/components/store/StoreSection";
import { StoreSidebar } from "@/components/store/StoreSidebar";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/providers/auth-provider";
import type { StoreProduct, StoreMeStatistics } from "@/lib/api-helpers";
import { publishStoreProduct, pauseStoreProduct, markProductSold } from "@/lib/api-helpers";

function PersonalPanel({
  open,
  onClose,
  myListings,
  myFavorites,
  myInquiries,
  myStats,
}: {
  open: boolean;
  onClose: () => void;
  myListings: StoreProduct[];
  myFavorites: StoreProduct[];
  myInquiries: any[];
  myStats: StoreMeStatistics | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md overflow-y-auto border-l bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5" /> Mi panel
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          {myStats && (
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border bg-emerald-50 p-2 text-center"><span className="block text-lg font-black">{myStats.activeProducts}</span>Publicaciones activas</div>
              <div className="rounded-lg border bg-indigo-50 p-2 text-center"><span className="block text-lg font-black">{myStats.favorites}</span>Guardados</div>
              <div className="rounded-lg border bg-sky-50 p-2 text-center"><span className="block text-lg font-black">{myStats.inquiriesSent}</span>Consultas enviadas</div>
              <div className="rounded-lg border bg-amber-50 p-2 text-center"><span className="block text-lg font-black">{myStats.inquiriesReceived}</span>Consultas recibidas</div>
            </div>
          )}

          {/* My listings */}
          <div className="mb-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Mis publicaciones
            </h3>
            {myListings.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">No tienes publicaciones. <Link href="/app/tienda/nuevo" className="text-indigo-600">Publicar ahora</Link></p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {myListings.slice(0, 10).map((p) => (
                  <li key={p.id}>
                    <Link href={`/app/tienda/${p.id}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-xs hover:bg-slate-100">
                      <span className="line-clamp-1 flex-1">{p.title}</span>
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                        p.status === "active" || p.status === "available" ? "bg-emerald-100 text-emerald-700" :
                        p.status === "draft" ? "bg-slate-100 text-slate-600" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status === "active" || p.status === "available" ? "Activo" : p.status === "draft" ? "Borrador" : p.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Favorites */}
          <div className="mb-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-600" /> Guardados
            </h3>
            {myFavorites.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">No tienes productos guardados.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {myFavorites.slice(0, 10).map((p) => (
                  <li key={p.id}>
                    <Link href={`/app/tienda/${p.id}`} className="block rounded-lg bg-slate-50 px-2.5 py-2 text-xs hover:bg-slate-100">
                      <span className="line-clamp-1">{p.title}</span>
                      {p.price != null && <span className="text-[10px] text-slate-500">S/ {p.price}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Inquiries */}
          <div className="mb-4">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" /> Mis consultas
            </h3>
            {myInquiries.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">No has enviado consultas.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {myInquiries.slice(0, 10).map((inq: any) => (
                  <li key={inq.id} className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
                    <p className="font-medium">{inq.product?.title ?? "Producto"}</p>
                    <p className="line-clamp-1 text-slate-600">{inq.message}</p>
                    <span className="text-[10px] text-slate-500">{inq.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const store = useStore();
  const { isAuthenticated } = useAuth();

  // Report modal state
  const [reportId, setReportId] = useState<string | null>(null);

  // Panel
  useEffect(() => {
    if (store.panelOpen) {
      store.loadPanel();
    }
  }, [store.panelOpen]);

  const viewerRole = store.isAdmin ? "ADMIN" : null;

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-6 py-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <main className="space-y-4">
        <StoreHeader
          onSearch={store.filterBySearch}
          q={store.q}
          onOpenPanel={() => store.setPanelOpen(true)}
          isAuthenticated={isAuthenticated}
          isAdmin={store.isAdmin}
        />

        {store.toast && (
          <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{store.toast}</div>
        )}

        {store.q && (
          <div className="text-sm text-slate-600">
            Resultados para <span className="font-semibold">{store.q}</span>
            <button onClick={() => store.filterBySearch("")} className="ml-2 text-indigo-600 hover:underline">Limpiar</button>
          </div>
        )}

        {!store.q && (
          <>
            <StoreSection title="¿Qué necesitas resolver hoy?" subtitle="Selecciona una intención para filtrar rápido.">
              <StoreNeedShortcuts active={store.categorySlug} onSelect={(id) => store.filterByCategory(id)} />
            </StoreSection>

            <StoreSection title="Radar académico de hoy" subtitle="Tendencias activas del mercado estudiantil.">
              <StoreAcademicRadar onPick={store.filterBySearch} />
            </StoreSection>
          </>
        )}

        <StoreSection title="Explorar productos" subtitle="Filtra y ordena como prefieras.">
          <StoreFilters
            categorySlug={store.categorySlug}
            setCategorySlug={store.filterByCategory}
            type={store.type}
            setType={store.filterByType}
            deliveryType={store.deliveryType}
            setDeliveryType={store.filterByDelivery}
            sort={store.sort}
            setSort={store.setSort}
          />

          {store.loading && <StoreLoadingState />}

          {!store.loading && store.error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <p className="font-semibold text-rose-700">{store.error}</p>
              <button onClick={store.refetch} className="mt-3 rounded-xl border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">Reintentar</button>
            </div>
          )}

          {!store.loading && !store.error && store.listings.length === 0 && (
            <StoreEmptyState onCreate={() => window.location.href = "/app/tienda/nuevo"} />
          )}

          {!store.loading && !store.error && store.listings.length > 0 && (
            <StoreListingGrid
              items={store.listings}
              onSave={store.toggleSave}
              onShare={store.shareProduct}
              onReport={(id) => setReportId(id)}
              onHide={() => {}}
              viewerRole={viewerRole}
            />
          )}
        </StoreSection>

        {store.featuredProducts.length > 0 && !store.q && (
          <StoreSection title="Productos destacados" subtitle="Selección de la comunidad">
            <StoreListingGrid
              items={store.featuredProducts}
              onSave={store.toggleSave}
              onShare={store.shareProduct}
              onReport={(id) => setReportId(id)}
              onHide={() => {}}
              viewerRole={viewerRole}
            />
          </StoreSection>
        )}
      </main>

      <StoreSidebar onSearch={store.filterBySearch} />

      {/* Report modal */}
      {reportId && (
        <StoreReportModal
          productId={reportId}
          onReport={store.reportProduct}
          onClose={() => setReportId(null)}
        />
      )}

      {/* Personal panel */}
      <PersonalPanel
        open={store.panelOpen}
        onClose={() => store.setPanelOpen(false)}
        myListings={store.myListings}
        myFavorites={store.myFavorites}
        myInquiries={store.myInquiries}
        myStats={store.myStats}
      />
    </div>
  );
}
