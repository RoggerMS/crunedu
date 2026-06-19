"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { UniversityItem, UniversityCalendarEvent, UniversityItemStatus, UniversityItemType, UniversityVisibility } from "@/components/university/types";
import { getUniversityContent, submitUniversitySuggestion } from "@/lib/api-helpers";
import { HttpClientError } from "@/lib/http-client";
import type { UniversityContentApiItem } from "@/lib/api-helpers";

function mapApiItem(item: UniversityContentApiItem): UniversityItem {
  const typeLower = (item.type?.toLowerCase() ?? "aviso") as UniversityItemType;
  return {
    id: String(item.id),
    type: typeLower,
    title: item.title,
    description: item.description,
    area: item.area,
    category: item.category,
    visibility: (item.visibility?.toLowerCase() ?? "publico") as UniversityVisibility,
    status: Array.isArray(item.statusTags) ? (item.statusTags as UniversityItemStatus[]) : [],
    startDate: item.startDate ? item.startDate.slice(0, 10) : undefined,
    endDate: item.endDate ? item.endDate.slice(0, 10) : undefined,
    deadline: item.deadline ? item.deadline.slice(0, 10) : undefined,
    time: item.time ?? undefined,
    location: item.location ?? undefined,
    cost: item.cost ?? undefined,
    file: item.fileUrl
      ? {
          id: `f-${item.id}`,
          name: item.fileName ?? "archivo",
          type: item.fileType ?? "unknown",
          size: item.fileSize ?? 0,
          url: item.fileUrl,
        }
      : undefined,
    externalUrl: item.externalUrl ?? undefined,
    tags: Array.isArray(item.statusTags) ? (item.statusTags as string[]) : [],
    stats: { views: item.views ?? 0, saves: item.savesCount ?? 0, shares: 0 },
    viewerState: { saved: false },
  };
}

function deriveCalendarEvents(items: UniversityItem[]): UniversityCalendarEvent[] {
  return items.flatMap((item) => {
    const date = item.startDate ?? item.deadline;
    if (!date) return [];
    return [
      {
        id: `evt-${item.id}`,
        itemId: item.id,
        title: item.title,
        date,
        type: item.type,
        location: item.location,
        time: item.time,
      },
    ];
  });
}

export function useUniversity(searchQuery: string) {
  const [items, setItems] = useState<UniversityItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("Todo");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUniversityContent({ limit: "30" });
      const mapped = (response.items ?? []).map(mapApiItem);
      setItems(mapped);
    } catch (err) {
      setError("No se pudo cargar la información universitaria.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const calendarEvents = useMemo(() => deriveCalendarEvents(items), [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const haystack = [item.title, item.description, item.category, item.area, item.type, item.location, ...item.tags].join(" ").toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesDay = !selectedDay || item.startDate?.endsWith(`-${String(selectedDay).padStart(2, "0")}`) || item.deadline?.endsWith(`-${String(selectedDay).padStart(2, "0")}`);
      const f = selectedFilter.toLowerCase();
      const matchesFilter =
        selectedFilter === "Todo" ||
        (selectedFilter === "Guardados"
          ? item.viewerState.saved
          : selectedFilter === "Urgentes"
            ? item.status.includes("urgente")
            : selectedFilter === "Oficiales"
              ? item.status.includes("oficial") || item.visibility === "oficial"
              : item.type === f ||
                item.category.toLowerCase().includes(f) ||
                item.area.toLowerCase().includes(f) ||
                item.tags.some((t) => t.toLowerCase().includes(f)));
      return matchesSearch && matchesFilter && matchesDay;
    });
  }, [items, searchQuery, selectedFilter, selectedDay]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const saveItem = (id: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, viewerState: { ...it.viewerState, saved: !it.viewerState.saved } } : it)));

  const shareItem = async (id: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/app/universidad/${id}`);
    showToast("Enlace copiado.");
  };

  const addToCalendar = () => showToast("Agregado a tu calendario.");
  const downloadFile = (item: UniversityItem) =>
    showToast(item.file?.url ? "Descarga iniciada." : "Archivo disponible cuando esté conectado.");

  const saveDraft = (payload: unknown) => {
    localStorage.setItem("crunedu_university_drafts", JSON.stringify(payload));
    showToast("Borrador guardado.");
  };

  const addSuggestion = async (payload: { type: string; title: string; description: string; area?: string; date?: string; location?: string; externalUrl?: string }) => {
    try {
      await submitUniversitySuggestion({
        type: payload.type,
        title: payload.title,
        description: payload.description,
        area: payload.area,
        date: payload.date,
        location: payload.location,
        externalUrl: payload.externalUrl,
      });
      showToast("Tu sugerencia fue enviada para revisión.");
      fetchItems();
    } catch (err) {
      if (err instanceof HttpClientError && err.status === 401) {
        showToast("Inicia sesión para enviar una sugerencia.");
      } else {
        showToast(err instanceof HttpClientError ? err.message : "Error al enviar la sugerencia.");
      }
    }
  };

  return {
    items: filteredItems,
    selectedFilter,
    setSelectedFilter,
    selectedDay,
    setSelectedDay,
    setQueryFilter: setSelectedFilter,
    addSuggestion,
    saveItem,
    shareItem,
    addToCalendar,
    downloadFile,
    saveDraft,
    toast,
    showToast,
    calendarEvents,
    loading,
    error,
  };
}
