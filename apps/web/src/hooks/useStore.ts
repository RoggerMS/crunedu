"use client";
import { useMemo, useState } from "react";
import { storeListingsSeed, storeNeeds } from "@/components/store/store-data";
import type { StoreDeliveryType, StoreListing, StoreSort } from "@/components/store/types";

export function useStore(initialQuery = "") {
  const [listings, setListings] = useState<StoreListing[]>(storeListingsSeed);
  const [selectedNeed, setSelectedNeed] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<StoreSort>("recent");
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<StoreDeliveryType | "all">("all");
  const [query, setQuery] = useState(initialQuery);
  const [toast, setToast] = useState<string | null>(null);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenListings, setHidden] = useState<string[]>([]);

  const filteredListings = useMemo(() => {
    let data = listings.filter((l) => !hiddenListings.includes(l.id));
    if (selectedNeed !== "all") data = data.filter((l) => storeNeeds.find((n) => n.id === selectedNeed)?.matcher(l));
    if (selectedCategory !== "all") data = data.filter((l) => l.category === selectedCategory);
    if (selectedDeliveryType !== "all") data = data.filter((l) => l.deliveryType === selectedDeliveryType);
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((l) => [l.title,l.description,l.category,l.course,l.faculty,l.seller.name,l.location,l.type,...l.tags].join(" ").toLowerCase().includes(q));
    }
    return sortListings(data, selectedSort);
  }, [listings, hiddenListings, selectedNeed, selectedCategory, selectedDeliveryType, query, selectedSort]);

  const savedListings = listings.filter((l) => l.viewerState.saved);
  const myListings = listings.filter((l) => l.viewerState.isMine);

  function pushToast(message:string){ setToast(message); setTimeout(()=>setToast(null),2200); }
  async function createListing(newListing:StoreListing){ setListings((p)=>[{...newListing,id:crypto.randomUUID()},...p]); pushToast("Producto publicado."); }
  function saveListing(id:string){ setListings((p)=>p.map(l=>l.id===id?{...l,viewerState:{...l.viewerState,saved:!l.viewerState.saved}}:l)); pushToast("Guardado actualizado."); }
  function contactSeller(title:string){ pushToast(`Consulta enviada por: ${title}`); }
  async function shareListing(id:string){ await navigator.clipboard.writeText(`/app/tienda/${id}`); pushToast("Enlace copiado."); }
  function reportListing(){ pushToast("Reporte enviado."); }
  function reserveListing(id:string){ setListings((p)=>p.map(l=>l.id===id?{...l,status:"reserved"}:l)); pushToast("Producto reservado."); }
  function hideListing(id:string){ setHidden((p)=>[...p,id]); pushToast("Publicación ocultada."); }
  function saveDraft(payload:unknown){ localStorage.setItem("crunedu_store_drafts", JSON.stringify(payload)); pushToast("Borrador guardado."); }
  function filterByNeed(need:string){ setSelectedNeed(need); }
  function filterByCategory(category:string){ setSelectedCategory(category); }
  function filterBySearch(text:string){ setQuery(text); }
  function getListingById(id:string){ return listings.find((l)=>l.id===id); }
  function getSimilarListings(id:string){ const item=getListingById(id); if(!item) return []; return listings.filter((l)=>l.id!==id && l.category===item.category).slice(0,4); }

  return { listings, filteredListings, savedListings, myListings, hiddenListings, selectedNeed, selectedCategory, selectedSort, selectedDeliveryType, query, toast, loading, error, setError, setQuery, setSelectedSort, setSelectedDeliveryType, createListing, saveListing, contactSeller, shareListing, reportListing, reserveListing, hideListing, saveDraft, filterByNeed, filterByCategory, filterBySearch, sortListings, getListingById, getSimilarListings };
}

export function sortListings(data: StoreListing[], sort: StoreSort) {
  const arr = [...data];

  if (sort === "low_price") {
    return arr.sort((a, b) => (a.price ?? 99999) - (b.price ?? 99999));
  }

  if (sort === "high_price") {
    return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }

  if (sort === "verified") {
    return arr.sort(
      (a, b) => Number(Boolean(b.seller.verified)) - Number(Boolean(a.seller.verified)),
    );
  }

  if (sort === "campus") {
    return arr.filter(
      (listing) => listing.deliveryType === "campus" || listing.deliveryType === "safe_point",
    );
  }

  if (sort === "off_campus") {
    return arr.filter((listing) => listing.deliveryType === "off_campus");
  }

  return arr;
}
