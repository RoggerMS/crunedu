"use client";

import { useMemo, useState } from "react";
import { calendarEventsFallback, universityItemsFallback } from "@/components/university/university-data";
import type { UniversityItem } from "@/components/university/types";

export function useUniversity(searchQuery: string) {
  const [items, setItems] = useState(universityItemsFallback);
  const [selectedFilter, setSelectedFilter] = useState("Todo");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      const haystack = [item.title, item.description, item.category, item.area, item.type, item.location, ...item.tags].join(" ").toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesDay = !selectedDay || item.startDate?.endsWith(`-${String(selectedDay).padStart(2, "0")}`) || item.deadline?.endsWith(`-${String(selectedDay).padStart(2, "0")}`);
      const f = selectedFilter.toLowerCase();
      const matchesFilter = selectedFilter === "Todo" || (selectedFilter === "Guardados" ? item.viewerState.saved :
        (selectedFilter === "Urgentes" && item.status.includes("urgente")) ||
        (selectedFilter === "Oficiales" && (item.status.includes("oficial") || item.visibility === "oficial")) ||
        item.type === f || item.category.toLowerCase().includes(f) || item.area.toLowerCase().includes(f) || item.tags.some((t) => t.toLowerCase().includes(f)));
      return matchesSearch && matchesFilter && matchesDay;
    });
  }, [items, searchQuery, selectedFilter, selectedDay]);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2000); };
  const saveItem = (id: string) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, viewerState: { ...it.viewerState, saved: !it.viewerState.saved } } : it)));
  const shareItem = async (id: string) => { await navigator.clipboard.writeText(`${window.location.origin}/app/universidad/${id}`); showToast("Enlace copiado."); };
  const addToCalendar = () => showToast("Agregado a tu calendario.");
  const downloadFile = (item: UniversityItem) => showToast(item.file?.url ? "Descarga iniciada." : "Archivo disponible cuando esté conectado.");
  const saveDraft = (payload: unknown) => { localStorage.setItem("crunedu_university_drafts", JSON.stringify(payload)); showToast("Borrador guardado."); };
  const addSuggestion = (item: UniversityItem) => { setItems((prev) => [{ ...item, status: ["pendiente_revision"], visibility: "sugerido" }, ...prev]); showToast("Tu sugerencia fue enviada para revisión."); };

  return { items: filteredItems, selectedFilter, setSelectedFilter, selectedDay, setSelectedDay, setQueryFilter: setSelectedFilter, addSuggestion, saveItem, shareItem, addToCalendar, downloadFile, saveDraft, toast, showToast, calendarEvents: calendarEventsFallback };
}
