"use client";
import { useParams } from "next/navigation";
import { StoreListingDetail } from "@/components/store/StoreListingDetail";
import { StoreListingGrid } from "@/components/store/StoreListingGrid";
import { StoreSection } from "@/components/store/StoreSection";
import { useStore } from "@/hooks/useStore";

export default function TiendaDetailPage(){const {id}=useParams<{id:string}>(); const s=useStore(); const item=s.getListingById(id); if(!item) return <p>Producto no disponible.</p>; const similar=s.getSimilarListings(id); return <div className="mx-auto max-w-[1200px] space-y-6 px-6 py-6"><StoreListingDetail item={item} onContact={()=>s.contactSeller(item.title)} onReserve={()=>s.reserveListing(item.id)} onSave={()=>s.saveListing(item.id)} onShare={()=>s.shareListing(item.id)} onReport={s.reportListing}/><StoreSection title="Productos similares"><StoreListingGrid items={similar} onSave={s.saveListing} onContact={s.contactSeller} onShare={s.shareListing} onReport={s.reportListing} onHide={s.hideListing}/></StoreSection></div>}
