"use client";

import { useMemo, useState } from "react";
import { calendarEventsFallback, universityItemsFallback } from "@/components/university/university-data";
import type { UniversityItem } from "@/components/university/types";

export function useUniversity(searchQuery: string) {
  const [items, setItems] = useState(universityItemsFallback);
  const [selectedFilter, setSelectedFilter] = useState("Todo");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !q || [item.title, item.description, item.category, item.area, item.type, item.location, item.file?.name, ...item.tags].filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchesFilter = selectedFilter === "Todo" || (selectedFilter === "Guardados" ? item.viewerState.saved : item.type === selectedFilter.toLowerCase() || item.category.toLowerCase().includes(selectedFilter.toLowerCase()));
      const matchesArea = !selectedArea || item.area === selectedArea;
      return matchesSearch && matchesFilter && matchesArea;
    });
  }, [items, searchQuery, selectedArea, selectedFilter]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  };

  const saveItem = (id: string) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, viewerState: { ...it.viewerState, saved: !it.viewerState.saved } } : it)));
  const shareItem = async (id: string) => { await navigator.clipboard.writeText(`${window.location.origin}/app/universidad/${id}`); showToast("Enlace copiado."); };
  const addToCalendar = () => showToast("Agregado a tu calendario.");
  const downloadFile = (item: UniversityItem) => showToast(item.file?.url ? "Descarga iniciada." : "Archivo disponible cuando esté conectado.");
  const reportOutdated = () => showToast("Gracias. Revisaremos esta información.");
  const saveDraft = (payload: unknown) => { localStorage.setItem("crunedu_university_drafts", JSON.stringify(payload)); showToast("Borrador guardado."); };
  const addSuggestion = (item: UniversityItem) => { setItems((prev) => [{ ...item, status: ["pendiente_revision"], visibility: "sugerido" }, ...prev]); showToast("Tu sugerencia fue enviada para revisión."); };

  return { items: filteredItems, allItems: items, calendarEvents: calendarEventsFallback, selectedFilter, setSelectedFilter, setSelectedArea, savedItems: items.filter((i) => i.viewerState.saved), addSuggestion, saveItem, shareItem, addToCalendar, downloadFile, reportOutdated, saveDraft, toast, setToast };
}
