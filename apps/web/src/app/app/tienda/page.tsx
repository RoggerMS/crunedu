"use client";

import { useSearchParams } from "next/navigation";
import { StoreAcademicRadar } from "@/components/store/StoreAcademicRadar";
import { StoreEmptyState } from "@/components/store/StoreEmptyState";
import { StoreFilters } from "@/components/store/StoreFilters";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreListingGrid } from "@/components/store/StoreListingGrid";
import { StoreLoadingState } from "@/components/store/StoreLoadingState";
import { StoreNeedShortcuts } from "@/components/store/StoreNeedShortcuts";
import { StoreSection } from "@/components/store/StoreSection";
import { StoreSidebar } from "@/components/store/StoreSidebar";
import type { StoreListing } from "@/components/store/types";
import { useStore } from "@/hooks/useStore";

export default function TiendaPage() {
  const params = useSearchParams();
  const store = useStore(params.get("q") ?? "");

  const academicListings = store.listings.filter((item) => ["books", "printed_notes", "calculators", "materials", "uniforms", "food"].includes(item.category));
  const servicesListings = store.listings.filter((item) => item.type === "service");
  const businessListings = store.listings.filter((item) => item.type === "student_business");
  const socialListings = store.listings.filter((item) => item.type === "exchange" || item.type === "donation");

  function cardContact(_title: string) {
    store.pushToast("Ve al detalle del producto para contactar al vendedor.");
  }

  function getSectionListings(section: StoreListing[], limit: number) {
    const filteredSection = store.filteredListings.filter((listing) => section.some((item) => item.id === listing.id));
    if (filteredSection.length >= Math.min(3, limit)) {
      return filteredSection.slice(0, limit);
    }
    return section.slice(0, limit);
  }

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-6 py-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="space-y-4">
        <StoreHeader onService={() => store.filterBySearch("servicio")} onMy={() => store.filterBySearch("Tú")} onSaved={() => store.filterBySearch("")} onConsultas={() => cardContact("Mis consultas")} />

        {store.toast ? <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{store.toast}</div> : null}

        <StoreSection title="¿Qué necesitas resolver hoy?" subtitle="Selecciona una intención para filtrar rápido.">
          <StoreNeedShortcuts active={store.selectedNeed} onSelect={store.filterByNeed} />
        </StoreSection>

        <StoreSection title="Radar académico de hoy" subtitle="Tendencias activas del mercado estudiantil.">
          <StoreAcademicRadar onPick={store.filterBySearch} />
        </StoreSection>

        <StoreSection title="Para tu vida académica" actionLabel="Ver más">
          <StoreListingGrid items={getSectionListings(academicListings, 6)} onSave={store.saveListing} onContact={cardContact} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} />
        </StoreSection>

        <StoreSection title="Servicios rápidos en campus" actionLabel="Ver más">
          <StoreListingGrid items={getSectionListings(servicesListings, 4)} onSave={store.saveListing} onContact={cardContact} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} />
        </StoreSection>

        <StoreSection title="Emprendimientos estudiantiles" actionLabel="Ver más">
          <StoreListingGrid items={getSectionListings(businessListings, 4)} onSave={store.saveListing} onContact={cardContact} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} />
        </StoreSection>

        <StoreSection title="Intercambios y donaciones" actionLabel="Ver más">
          <StoreListingGrid items={getSectionListings(socialListings, 4)} onSave={store.saveListing} onContact={cardContact} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} />
        </StoreSection>

        <StoreSection title="Explorar todo" subtitle="Filtra por categoría, entrega y ordenamiento.">
          <StoreFilters category={store.selectedCategory} setCategory={store.filterByCategory} sort={store.selectedSort} setSort={store.setSelectedSort} delivery={store.selectedDeliveryType} setDelivery={store.setSelectedDeliveryType} />
          {store.loading ? <StoreLoadingState /> : null}
          {!store.loading && store.filteredListings.length === 0 ? <StoreEmptyState onCreate={() => { window.location.href = "/app/tienda/nuevo"; }} /> : null}
          {!store.loading && store.filteredListings.length > 0 ? <StoreListingGrid items={store.filteredListings} onSave={store.saveListing} onContact={cardContact} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /> : null}
        </StoreSection>
      </main>
      <StoreSidebar onSearch={store.filterBySearch} />
    </div>
  );
}
