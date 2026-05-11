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
  const [hiddenListings, setHidden] = useState<string[]>([]);

  const filteredListings = useMemo(() => {
    let data = listings.filter((listing) => !hiddenListings.includes(listing.id));
    if (selectedNeed !== "all") {
      const selected = storeNeeds.find((need) => need.id === selectedNeed);
      data = data.filter((listing) => selected?.matcher(listing));
    }
    if (selectedCategory !== "all") data = data.filter((listing) => listing.category === selectedCategory);
    if (selectedDeliveryType !== "all") data = data.filter((listing) => listing.deliveryType === selectedDeliveryType);
    if (query.trim()) {
      const normalizedQuery = query.toLowerCase();
      data = data.filter((listing) => {
        const haystack = [listing.title, listing.description, listing.category, listing.course, listing.faculty, listing.seller.name, listing.location, listing.type, ...listing.tags].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
    return sortListings(data, selectedSort);
  }, [hiddenListings, listings, query, selectedCategory, selectedDeliveryType, selectedNeed, selectedSort]);

  function pushToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  function createListing(newListing: StoreListing) {
    setListings((previous) => [{ ...newListing, id: crypto.randomUUID() }, ...previous]);
    pushToast("Producto publicado.");
  }

  function saveListing(id: string) {
    setListings((previous) => previous.map((listing) => (listing.id === id ? { ...listing, viewerState: { ...listing.viewerState, saved: !listing.viewerState.saved } } : listing)));
    pushToast("Guardado actualizado.");
  }

  function contactSeller(title: string) { pushToast(`Consulta enviada por: ${title}`); }
  async function shareListing(id: string) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`/app/tienda/${id}`);
      pushToast("Enlace copiado.");
      return;
    }
    pushToast("No se pudo copiar el enlace en este navegador.");
  }
  function reportListing() { pushToast("Reporte enviado."); }
  function reserveListing(id: string) {
    setListings((previous) => previous.map((listing) => (listing.id === id ? { ...listing, status: "reserved" } : listing)));
    pushToast("Producto reservado.");
  }
  function hideListing(id: string) { setHidden((previous) => [...previous, id]); pushToast("Publicación ocultada."); }
  function saveDraft(payload: unknown) { localStorage.setItem("crunedu_store_drafts", JSON.stringify(payload)); pushToast("Borrador guardado."); }

  function getListingById(id: string) { return listings.find((listing) => listing.id === id); }
  function getSimilarListings(id: string) {
    const current = getListingById(id);
    if (!current) return [];
    const sameCategory = listings.filter((listing) => listing.id !== id && listing.category === current.category);
    const byTags = listings.filter((listing) => listing.id !== id && listing.category !== current.category && listing.tags.some((tag) => current.tags.includes(tag)));
    return [...sameCategory, ...byTags].slice(0, 4);
  }

  return { listings, filteredListings, selectedNeed, selectedCategory, selectedSort, selectedDeliveryType, query, toast, loading, setQuery, setSelectedSort, setSelectedDeliveryType, createListing, saveListing, contactSeller, shareListing, reportListing, reserveListing, hideListing, saveDraft, filterByNeed: setSelectedNeed, filterByCategory: setSelectedCategory, filterBySearch: setQuery, getListingById, getSimilarListings };
}

export function sortListings(data: StoreListing[], sort: StoreSort) {
  const arr = [...data];
  if (sort === "low_price") return arr.sort((a, b) => (a.price ?? 99999) - (b.price ?? 99999));
  if (sort === "high_price") return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  if (sort === "verified") return arr.sort((a, b) => Number(Boolean(b.seller.verified)) - Number(Boolean(a.seller.verified)));
  if (sort === "campus") return arr.filter((listing) => listing.deliveryType === "campus" || listing.deliveryType === "safe_point");
  if (sort === "off_campus") return arr.filter((listing) => listing.deliveryType === "off_campus");
  return arr;
}
