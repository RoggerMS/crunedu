"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { StoreListing, StoreSort } from "@/components/store/types";
import {
  getStoreCatalog,
  favoriteStoreProduct,
  reportStoreProduct,
  createStoreInquiry,
  getStoreMeStatistics,
  getStoreMyFavorites,
  getStoreMyListings,
  getStoreMyInquiries,
  type StoreProduct,
  type StoreCatalogResponse,
  type StoreMeStatistics,
} from "@/lib/api-helpers";
import { useAuth } from "@/providers/auth-provider";

const TOKEN_KEY = "crunedu_access_token";

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
}

export function useStore() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, accessToken } = useAuth();

  const [listings, setListings] = useState<StoreProduct[]>([]);
  const [featuredProducts, setFeatured] = useState<StoreProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const popToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  // Admin role from JWT
  const viewerRole = useMemo(() => {
    try {
      const token = accessToken || getToken();
      if (!token) return null;
      const [, payload] = token.split(".");
      if (!payload) return null;
      return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ?? null;
    } catch {
      return null;
    }
  }, [accessToken]);

  const isAdmin = viewerRole === "ADMIN";

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [myListings, setMyListings] = useState<StoreProduct[]>([]);
  const [myFavorites, setMyFavorites] = useState<StoreProduct[]>([]);
  const [myInquiries, setMyInquiries] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<StoreMeStatistics | null>(null);
  const panelLoading = useRef(false);

  // Filters from URL
  const q = searchParams.get("q") ?? "";
  const categorySlug = searchParams.get("category") ?? "";
  const type = searchParams.get("type") ?? "";
  const deliveryType = searchParams.get("delivery") ?? "";
  const conditionFilter = searchParams.get("condition") ?? "";
  const sort = (searchParams.get("sort") ?? "recent") as StoreSort;
  const priceMin = searchParams.get("priceMin") ?? "";
  const priceMax = searchParams.get("priceMax") ?? "";
  const safePointId = searchParams.get("safePoint") ?? "";

  // Refresh catalog
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, string | number | boolean> = { limit: 20 };
      if (q) queryParams.q = q;
      if (categorySlug) queryParams.categorySlug = categorySlug;
      if (type) queryParams.type = type.toUpperCase();
      if (deliveryType) queryParams.deliveryType = deliveryType.toUpperCase();
      if (conditionFilter) queryParams.condition = conditionFilter.toUpperCase();
      if (sort && sort !== "recent") queryParams.sort = sort;
      if (priceMin) queryParams.priceMin = Number(priceMin);
      if (priceMax) queryParams.priceMax = Number(priceMax);
      if (safePointId) queryParams.safePointId = Number(safePointId);

      const response: StoreCatalogResponse = await getStoreCatalog(queryParams);
      setListings(response.items ?? []);
      setFeatured(response.featuredProducts ?? []);
      setNextCursor(response.nextCursor);
    } catch {
      setError("No se pudo cargar la tienda.");
    } finally {
      setLoading(false);
    }
  }, [q, categorySlug, type, deliveryType, conditionFilter, sort, priceMin, priceMax, safePointId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Load personal panel data
  const loadPanel = useCallback(async () => {
    const token = accessToken || getToken();
    if (!token) return;
    if (panelLoading.current) return;
    panelLoading.current = true;
    try {
      const [listings, favs, inquiries, stats] = await Promise.all([
        getStoreMyListings(token),
        getStoreMyFavorites(token),
        getStoreMyInquiries(token),
        getStoreMeStatistics(token),
      ]);
      setMyListings(listings);
      setMyFavorites(favs);
      setMyInquiries(inquiries);
      setMyStats(stats);
    } catch {
      // Silently fail panel
    } finally {
      panelLoading.current = false;
    }
  }, [accessToken]);

  // URL helpers
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Actions
  const filterByCategory = (slug: string) => updateUrl({ category: slug === "all" ? "" : slug });
  const filterByType = (t: string) => updateUrl({ type: t === "all" ? "" : t });
  const filterByDelivery = (d: string) => updateUrl({ delivery: d === "all" ? "" : d });
  const filterBySearch = (text: string) => updateUrl({ q: text });
  const setSort = (s: string) => updateUrl({ sort: s === "recent" ? "" : s });

  async function toggleSave(productId: string) {
    const token = accessToken || getToken();
    if (!token) { popToast("Inicia sesión para guardar productos."); return; }
    try {
      await favoriteStoreProduct(productId, token);
      popToast("Guardado actualizado.");
      fetchCatalog();
    } catch { popToast("Error al guardar."); }
  }

  function shareProduct(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/app/tienda/${id}`);
    popToast("Enlace copiado.");
  }

  async function reportProduct(productId: string, reason: string, description?: string) {
    const token = accessToken || getToken();
    if (!token) { popToast("Inicia sesión para reportar."); return; }
    try {
      await reportStoreProduct(productId, { reason, description }, token);
      popToast("Reporte enviado. Gracias por ayudarnos.");
    } catch (err: any) {
      popToast(err?.message ?? "Error al enviar el reporte.");
    }
  }

  async function sendInquiry(productId: string, message: string, quickMessageType?: string) {
    const token = accessToken || getToken();
    if (!token) { popToast("Inicia sesión para contactar."); return; }
    try {
      await createStoreInquiry(productId, { message, quickMessageType, preferredContactMethod: "chat" }, token);
      popToast("Consulta enviada.");
    } catch { popToast("Error al enviar la consulta."); }
  }

  return {
    listings,
    featuredProducts,
    filteredListings: listings,
    nextCursor,
    loading,
    error,
    toast,
    popToast,
    q,
    categorySlug,
    type,
    deliveryType,
    conditionFilter,
    sort,
    priceMin,
    priceMax,
    safePointId,
    isAdmin,
    filterByCategory,
    filterByType,
    filterByDelivery,
    filterBySearch,
    setSort,
    toggleSave,
    shareProduct,
    reportProduct,
    sendInquiry,
    refetch: fetchCatalog,
    panelOpen,
    setPanelOpen,
    myListings,
    myFavorites,
    myInquiries,
    myStats,
    loadPanel,
  };
}
