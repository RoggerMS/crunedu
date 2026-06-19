"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { storeNeeds } from "@/components/store/store-data";
import type { StoreCategory, StoreDeliveryType, StoreListing, StoreSort } from "@/components/store/types";
import { getStoreCatalog } from "@/lib/api-helpers";
import type { StoreProduct } from "@/lib/api-helpers";
import { apiRequest } from "@/lib/http-client";

function mapCategoryName(name?: string | null): StoreCategory {
  if (!name) return "materials";
  const lower = name.toLowerCase();
  if (lower.includes("material") || lower.includes("estudio")) return "books";
  if (lower.includes("útil") || lower.includes("util")) return "materials";
  if (lower.includes("merch")) return "business";
  if (lower.includes("curso") || lower.includes("taller")) return "services";
  return "materials";
}

function mapApiProduct(product: StoreProduct): StoreListing {
  return {
    id: String(product.id),
    type: "sale",
    title: product.title,
    description: product.description,
    price: Number(product.price) || undefined,
    currency: "PEN",
    category: mapCategoryName(product.category?.name),
    status: "available",
    badges: product.isFeatured ? ["Destacado"] : [],
    images: [],
    seller: {
      id: "crunedu",
      name: "CrunEdu",
      rating: 5,
      verified: true,
      sales: 0,
    },
    location: "Campus UNE",
    deliveryType: "campus",
    tags: [],
    createdAt: product.createdAt ?? new Date().toISOString(),
    stats: { views: 0, saves: 0, contacts: 0 },
    viewerState: { saved: false },
  };
}

const TOKEN_KEY = "crunedu_access_token";

export function useStore(initialQuery = "") {
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<StoreSort>("recent");
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<StoreDeliveryType | "all">("all");
  const [query, setQuery] = useState(initialQuery);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenListings, setHidden] = useState<string[]>([]);

  const pushToast = useCallback((message: string) => {
    setToast(message);
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStoreCatalog({ limit: 40 });
      const mapped = (response.items ?? []).map(mapApiProduct);
      setListings(mapped);
    } catch {
      setError("No se pudo cargar la tienda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

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
        const haystack = [listing.title, listing.description, listing.category, listing.location, listing.seller.name, listing.tags.join(" ")].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
    return sortListings(data, selectedSort);
  }, [hiddenListings, listings, query, selectedCategory, selectedDeliveryType, selectedNeed, selectedSort]);

  function createListing() {
    pushToast("En esta fase Beta, la tienda es administrada por CrunEdu. Contáctanos para publicar tus productos.");
  }

  function saveListing(id: string) {
    setListings((previous) =>
      previous.map((listing) =>
        listing.id === id
          ? { ...listing, viewerState: { ...listing.viewerState, saved: !listing.viewerState.saved } }
          : listing,
      ),
    );
    pushToast("Guardado actualizado.");
  }

  function shareListing(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/app/tienda/${id}`);
    pushToast("Enlace copiado.");
  }

  function reportListing() {
    pushToast("Función en desarrollo.");
  }

  function reserveListing(_id: string) {
    pushToast("Función en desarrollo.");
  }

  function hideListing(id: string) {
    setHidden((previous) => [...previous, id]);
    pushToast("Publicación ocultada.");
  }

  function saveDraft(payload: unknown) {
    localStorage.setItem("crunedu_store_drafts", JSON.stringify(payload));
    pushToast("Borrador guardado.");
  }

  async function contactSeller(payload: { productId: string; contactName: string; contactPhone: string; message: string }) {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY)?.trim() : null;
    if (!token) {
      pushToast("Inicia sesión para contactar al vendedor.");
      return;
    }
    try {
      await apiRequest(`/marketplace/products/${payload.productId}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactName: payload.contactName,
          contactPhone: payload.contactPhone,
          message: payload.message,
          preferredContactMethod: "whatsapp",
        }),
      });
      pushToast("Consulta enviada.");
    } catch {
      pushToast("Error al enviar la consulta.");
    }
  }

  function getListingById(id: string) {
    return listings.find((listing) => listing.id === id);
  }

  function getSimilarListings(id: string) {
    const current = getListingById(id);
    if (!current) return [];
    const sameCategory = listings.filter((listing) => listing.id !== id && listing.category === current.category);
    const byTags = listings.filter(
      (listing) => listing.id !== id && listing.category !== current.category && listing.tags.some((tag) => current.tags.includes(tag)),
    );
    return [...sameCategory, ...byTags].slice(0, 4);
  }

  return {
    listings,
    filteredListings,
    selectedNeed,
    selectedCategory,
    selectedSort,
    selectedDeliveryType,
    query,
    toast,
    loading,
    error,
    setQuery,
    setSelectedSort,
    setSelectedDeliveryType,
    createListing,
    saveListing,
    contactSeller,
    shareListing,
    reportListing,
    reserveListing,
    hideListing,
    saveDraft,
    filterByNeed: setSelectedNeed,
    filterByCategory: setSelectedCategory,
    filterBySearch: setQuery,
    getListingById,
    getSimilarListings,
    refetch: fetchCatalog,
    pushToast,
  };
}

export function sortListings(data: StoreListing[], sort: StoreSort) {
  const arr = [...data];
  if (sort === "low_price") return arr.sort((a, b) => (a.price ?? 99999) - (b.price ?? 99999));
  if (sort === "high_price") return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  if (sort === "verified") return arr;
  if (sort === "campus") return arr.filter((listing) => listing.deliveryType === "campus" || listing.deliveryType === "safe_point");
  if (sort === "off_campus") return arr.filter((listing) => listing.deliveryType === "off_campus");
  return arr;
}
