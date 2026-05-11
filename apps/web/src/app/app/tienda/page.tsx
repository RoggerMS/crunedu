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
import { useStore } from "@/hooks/useStore";

export default function TiendaPage() {
  const params = useSearchParams();
  const store = useStore(params.get("q") ?? "");

  const academic = store.filteredListings.filter((item) => ["books", "printed_notes", "calculators", "materials", "uniforms", "food"].includes(item.category));
  const services = store.filteredListings.filter((item) => item.type === "service");
  const business = store.filteredListings.filter((item) => item.type === "student_business");
  const social = store.filteredListings.filter((item) => item.type === "exchange" || item.type === "donation");

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-6 xl:grid-cols-[1fr_320px]">
      <main className="space-y-6">
        <input value={store.query} onChange={(event) => store.setQuery(event.target.value)} placeholder="¿Qué necesitas para tus clases o tu vida en campus?" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" />
        <StoreHeader onService={() => store.filterBySearch("servicio")} onMy={() => store.filterBySearch("Tú")} onSaved={() => store.filterBySearch("")} onConsultas={() => store.contactSeller("Mis consultas")} />
        {store.toast ? <div className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{store.toast}</div> : null}
        <StoreSection title="¿Qué necesitas resolver hoy?" subtitle="Selecciona una intención para filtrar rápido."><StoreNeedShortcuts active={store.selectedNeed} onSelect={store.filterByNeed} /></StoreSection>
        <StoreSection title="Radar académico de hoy" subtitle="Tendencias activas del mercado estudiantil."><StoreAcademicRadar onPick={store.filterBySearch} /></StoreSection>
        <StoreSection title="Para tu vida académica" actionLabel="Ver más"><StoreListingGrid items={academic.slice(0, 6)} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /></StoreSection>
        <StoreSection title="Servicios rápidos en campus" actionLabel="Ver más"><StoreListingGrid items={services.slice(0, 6)} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /></StoreSection>
        <StoreSection title="Emprendimientos estudiantiles" actionLabel="Ver más"><StoreListingGrid items={business.slice(0, 5)} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /></StoreSection>
        <StoreSection title="Intercambios y donaciones" actionLabel="Ver más"><StoreListingGrid items={social.slice(0, 4)} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /></StoreSection>
        <StoreSection title="Explorar todo" subtitle="Filtra por categoría, entrega y ordenamiento."><StoreFilters category={store.selectedCategory} setCategory={store.filterByCategory} sort={store.selectedSort} setSort={store.setSelectedSort} delivery={store.selectedDeliveryType} setDelivery={store.setSelectedDeliveryType} />{store.loading ? <StoreLoadingState /> : store.filteredListings.length === 0 ? <StoreEmptyState onCreate={() => { window.location.href = "/app/tienda/nuevo"; }} /> : <StoreListingGrid items={store.filteredListings} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} />}</StoreSection>
      </main>
      <StoreSidebar onSearch={store.filterBySearch} />
    </div>
  );
}
