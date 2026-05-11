"use client";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/hooks/useStore";
import { StoreAcademicRadar } from "@/components/store/StoreAcademicRadar";
import { StoreEmptyState } from "@/components/store/StoreEmptyState";
import { StoreFilters } from "@/components/store/StoreFilters";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreListingGrid } from "@/components/store/StoreListingGrid";
import { StoreLoadingState } from "@/components/store/StoreLoadingState";
import { StoreNeedShortcuts } from "@/components/store/StoreNeedShortcuts";
import { StoreSection } from "@/components/store/StoreSection";
import { StoreSidebar } from "@/components/store/StoreSidebar";

export default function TiendaPage(){
  const params=useSearchParams();
  const s=useStore(params.get("q")??"");
  const academic=s.filteredListings.filter((x)=>["books","printed_notes","calculators","materials","uniforms"].includes(x.category));
  const services=s.filteredListings.filter((x)=>x.type==="service");
  const business=s.filteredListings.filter((x)=>x.type==="student_business");
  const social=s.filteredListings.filter((x)=>x.type==="exchange"||x.type==="donation");
  return <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-6 xl:grid-cols-[1fr_320px]">
    <main className="space-y-6">
      <StoreHeader onService={()=>s.setQuery("servicio")} onMy={()=>s.filterBySearch("María Fernanda")} onSaved={()=>s.filterBySearch("")||s.filterByCategory("all")} onConsultas={()=>s.contactSeller("Mis consultas")}/>
      {s.toast && <div className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{s.toast}</div>}
      <StoreSection title="¿Qué necesitas resolver hoy?"><StoreNeedShortcuts active={s.selectedNeed} onSelect={s.filterByNeed}/></StoreSection>
      <StoreSection title="Radar académico de hoy"><StoreAcademicRadar onPick={s.filterBySearch}/></StoreSection>
      <StoreSection title="Para tu vida académica"><StoreListingGrid items={academic.slice(0,6)} onSave={s.saveListing} onContact={s.contactSeller} onShare={s.shareListing} onReport={s.reportListing} onHide={s.hideListing}/></StoreSection>
      <StoreSection title="Servicios rápidos en campus"><StoreListingGrid items={services.slice(0,6)} onSave={s.saveListing} onContact={s.contactSeller} onShare={s.shareListing} onReport={s.reportListing} onHide={s.hideListing}/></StoreSection>
      <StoreSection title="Emprendimientos estudiantiles"><StoreListingGrid items={business.slice(0,4)} onSave={s.saveListing} onContact={s.contactSeller} onShare={s.shareListing} onReport={s.reportListing} onHide={s.hideListing}/></StoreSection>
      <StoreSection title="Intercambios y donaciones"><StoreListingGrid items={social.slice(0,4)} onSave={s.saveListing} onContact={s.contactSeller} onShare={s.shareListing} onReport={s.reportListing} onHide={s.hideListing}/></StoreSection>
      <StoreSection title="Explorar todo"><StoreFilters category={s.selectedCategory} setCategory={s.filterByCategory} sort={s.selectedSort} setSort={s.setSelectedSort} delivery={s.selectedDeliveryType} setDelivery={s.setSelectedDeliveryType}/>{s.loading ? <StoreLoadingState/> : s.filteredListings.length===0 ? <StoreEmptyState onCreate={()=>window.location.href="/app/tienda/nuevo"}/> : <StoreListingGrid items={s.filteredListings} onSave={s.saveListing} onContact={s.contactSeller} onShare={s.shareListing} onReport={s.reportListing} onHide={s.hideListing}/>}</StoreSection>
    </main>
    <StoreSidebar onSearch={s.filterBySearch}/>
  </div>
}
