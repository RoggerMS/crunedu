"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, LayoutList, Columns3, Filter, Maximize2, Minimize2, Clock, MapPin, AlertTriangle, Star, Bookmark, BookmarkCheck } from "lucide-react";
import type { CalendarItemApiItem, MonthEventApiItem, ContentCategoryApiItem } from "@/lib/api-helpers";
import {
  getUniversityCalendarItems, getUniversityMonthEvents, getUniversityCategories,
  getUniversityPriorityAlerts, getUniversityOverview, getUniversityCalendarItemById,
  getSavedCalendarItems, saveCalendarItem, removeSavedCalendarItem, buildCalendarItemIcsUrl
} from "@/lib/api-helpers";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarAgendaView } from "./CalendarAgendaView";
import { CalendarItemDetail } from "./CalendarItemDetail";

type CalendarView = "month" | "week" | "agenda";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("accessToken");
    return stored || null;
  } catch { return null; }
}

function formatDateParam(date: Date, view: CalendarView): string {
  if (view === "week") {
    const d = new Date(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDateParam(str: string | null, view: CalendarView): Date {
  if (str) {
    const parts = str.split("-").map(Number);
    if (view === "week" && parts.length >= 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    if (parts.length >= 2) return new Date(parts[0], (parts[1] || 1) - 1, 1);
  }
  return new Date();
}

export function UniversityCalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get("view") as CalendarView | null;
  const dateParam = searchParams.get("date");
  const activeView: CalendarView = viewParam === "week" || viewParam === "agenda" ? viewParam : "month";
  const [currentDate, setCurrentDate] = useState(() => parseDateParam(dateParam, activeView));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const [monthEvents, setMonthEvents] = useState<MonthEventApiItem[]>([]);
  const [allItems, setAllItems] = useState<CalendarItemApiItem[]>([]);
  const [categories, setCategories] = useState<ContentCategoryApiItem[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const [detailItemId, setDetailItemId] = useState<number | null>(null);

  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterSaved, setFilterSaved] = useState(false);
  const [filterModality, setFilterModality] = useState<string | null>(null);

  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<number>>(new Set());

  const token = useMemo(() => getToken(), []);

  const syncUrl = useCallback((view: CalendarView, date: Date) => {
    const dp = formatDateParam(date, view);
    router.replace(`/app/universidad/calendario?view=${view}&date=${dp}`, { scroll: false });
  }, [router]);

  const changeView = useCallback((view: CalendarView) => {
    syncUrl(view, currentDate);
  }, [syncUrl, currentDate]);

  const goToday = useCallback(() => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedDate(null);
    syncUrl(activeView, d);
  }, [syncUrl, activeView]);

  const goPrev = useCallback(() => {
    const d = new Date(currentDate);
    if (activeView === "month") { d.setMonth(d.getMonth() - 1); }
    else if (activeView === "week") { d.setDate(d.getDate() - 7); }
    else { d.setMonth(d.getMonth() - 1); }
    setCurrentDate(d);
    syncUrl(activeView, d);
  }, [currentDate, activeView, syncUrl]);

  const goNext = useCallback(() => {
    const d = new Date(currentDate);
    if (activeView === "month") { d.setMonth(d.getMonth() + 1); }
    else if (activeView === "week") { d.setDate(d.getDate() + 7); }
    else { d.setMonth(d.getMonth() + 1); }
    setCurrentDate(d);
    syncUrl(activeView, d);
  }, [currentDate, activeView, syncUrl]);

  const goToDate = useCallback((dateStr: string) => {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      setCurrentDate(d);
      setSelectedDate(dateStr);
      if (activeView === "month") syncUrl("month", d);
    }
  }, [activeView, syncUrl]);

  useEffect(() => {
    setActiveCategoryIds(new Set(categories.map((c) => c.id)));
  }, [categories]);

  useEffect(() => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
    const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);

    const params: Record<string, string> = {};
    if (filterCategoryId) params.categoryId = String(filterCategoryId);
    if (filterPriority) params.priority = filterPriority;
    if (filterFeatured) params.onlyFeatured = "true";
    if (filterModality) params.modality = filterModality;

    Promise.all([
      getUniversityMonthEvents(year, month).catch(() => []),
      getUniversityCalendarItems({ ...params, startDate, endDate }).catch(() => []),
      getUniversityCategories().catch(() => []),
      getUniversityPriorityAlerts().catch(() => []),
      getUniversityOverview().catch(() => ({ alerts: [], upcomingDates: [], mostConsulted: [], areas: [], upcomingEvents: [] })),
      token ? getSavedCalendarItems(token).catch(() => []) : Promise.resolve([]),
    ]).then(([me, items, cats, al, ov, saved]) => {
      setMonthEvents(me as MonthEventApiItem[]);
      setAllItems(items as CalendarItemApiItem[]);
      setCategories(cats as ContentCategoryApiItem[]);
      setAlerts(al as any[]);
      setUpcoming((ov as any).upcomingDates || []);
      if (saved && Array.isArray(saved)) {
        setSavedIds(new Set((saved as any[]).map((s) => s.id)));
      }
    }).finally(() => setLoading(false));
  }, [currentDate, filterCategoryId, filterPriority, filterFeatured, filterModality, token]);

  const handleSelectDay = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
  }, []);

  const handleDayDoubleClick = useCallback((dateStr: string) => {
    router.push(`/app/universidad/calendario/${dateStr}`);
  }, [router]);

  const handleToggleCategory = useCallback((id: number) => {
    setActiveCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    const bySaved = filterSaved ? allItems.filter((item) => savedIds.has(item.id)) : allItems;
    if (activeCategoryIds.size === categories.length) return bySaved;
    return bySaved.filter((item) => activeCategoryIds.has(item.category?.id || 0));
  }, [allItems, activeCategoryIds, categories.length, filterSaved, savedIds]);

  const rightSideEvents = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || "")).slice(0, 8);
    return sorted;
  }, [filteredItems]);

  const upcomingDates = useMemo(() => {
    const now = new Date();
    return [...filteredItems]
      .filter((i) => i.startsAt && new Date(i.startsAt) >= now)
      .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))
      .slice(0, 5);
  }, [filteredItems]);

  const clearFilters = useCallback(() => {
    setFilterCategoryId(null);
    setFilterPriority(null);
    setFilterFeatured(false);
    setFilterSaved(false);
    setFilterModality(null);
  }, []);

  const hasFilters = filterCategoryId || filterPriority || filterFeatured || filterSaved || filterModality;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/app/universidad" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-1">
            <ArrowLeft size={16} />
            Volver a Universidad
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Calendario universitario</h1>
          <p className="text-sm text-slate-600 mt-0.5">Consulta fechas, tramites, convocatorias, eventos y servicios en un solo lugar.</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => changeView("month")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            <CalendarDays size={14} />Mes
          </button>
          <button onClick={() => changeView("week")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === "week" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            <Columns3 size={14} />Semana
          </button>
          <button onClick={() => changeView("agenda")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${activeView === "agenda" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            <LayoutList size={14} />Agenda
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">Hoy</button>
          <button onClick={() => setFilterOpen(!filterOpen)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${filterOpen || hasFilters ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <Filter size={14} />Filtros{hasFilters ? " (1)" : ""}
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Filtros</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-semibold text-red-600 hover:text-red-800">Limpiar filtros</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Categoria</label>
              <select value={filterCategoryId || ""} onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : null)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Prioridad</label>
              <select value={filterPriority || ""} onChange={(e) => setFilterPriority(e.target.value || null)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="">Todas</option>
                <option value="URGENT">Urgente</option>
                <option value="IMPORTANT">Importante</option>
                <option value="NORMAL">Normal</option>
                <option value="CRITICAL">Critico</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Modalidad</label>
              <select value={filterModality || ""} onChange={(e) => setFilterModality(e.target.value || null)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="">Todas</option>
                <option value="IN_PERSON">Presencial</option>
                <option value="ONLINE">En linea</option>
                <option value="HYBRID">Mixto</option>
              </select>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filterFeatured} onChange={(e) => setFilterFeatured(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400" />
                <span className="text-sm text-slate-700">Solo destacados</span>
              </label>
              {token && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterSaved} onChange={(e) => setFilterSaved(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400" />
                  <span className="text-sm text-slate-700">Solo guardados</span>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${fullscreen ? "" : "lg:grid-cols-[1fr_320px]"} gap-4`}>
        <div className="space-y-4">
          {activeView === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              onPrevMonth={goPrev}
              onNextMonth={goNext}
              onToday={goToday}
              monthEvents={monthEvents}
              categories={categories}
              activeCategoryIds={activeCategoryIds}
              onToggleCategory={handleToggleCategory}
              onSelectDay={handleSelectDay}
              onDayDoubleClick={handleDayDoubleClick}
              selectedDate={selectedDate}
            />
          )}

          {activeView === "week" && (
            <CalendarWeekView
              currentDate={currentDate}
              onPrevWeek={goPrev}
              onNextWeek={goNext}
              onToday={goToday}
              items={filteredItems}
              onSelectEvent={(id) => setDetailItemId(id)}
              onDayClick={(dateStr) => goToDate(dateStr)}
            />
          )}

          {activeView === "agenda" && (
            <CalendarAgendaView
              items={filteredItems}
              onSelectEvent={(id) => setDetailItemId(id)}
              loading={loading}
            />
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Agenda destacada</h3>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems
                  .filter((i) => i.isFeatured || i.priority === "URGENT" || i.priority === "CRITICAL")
                  .sort((a, b) => (a.startsAt || "").localeCompare(b.startsAt || ""))
                  .slice(0, 5)
                  .map((item) => {
                    const isUrgent = item.priority === "URGENT" || item.priority === "CRITICAL";
                    return (
                      <button
                        key={item.id}
                        onClick={() => setDetailItemId(item.id)}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                      >
                        <div className="w-1 h-10 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.category?.color || "#6366F1" }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">{item.title}</span>
                            {isUrgent && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                            {item.isFeatured && <Star size={12} className="text-amber-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            {item.startsAt && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(item.startsAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                                {!item.allDay && ` ${item.startsAt.slice(11, 16)}`}
                              </span>
                            )}
                            {item.locationName && <><MapPin size={10} /><span>{item.locationName}</span></>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                {filteredItems.filter((i) => i.isFeatured || i.priority === "URGENT" || i.priority === "CRITICAL").length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No hay eventos destacados para este periodo.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {!fullscreen && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Eventos del mes</h3>
              <div className="space-y-2">
                {rightSideEvents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDetailItemId(item.id)}
                    className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {item.startsAt && (
                      <div className="text-center min-w-[36px]">
                        <p className="text-lg font-black text-slate-700 leading-none">{new Date(item.startsAt).getDate()}</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">{new Date(item.startsAt).toLocaleDateString("es-ES", { month: "short" })}</p>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.category?.color || "#6366F1" }} />
                        <span className="text-[10px] text-slate-500">{item.category?.name || ""}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {rightSideEvents.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No hay eventos este mes.</p>
                )}
              </div>
              <button
                onClick={() => changeView("agenda")}
                className="w-full text-center text-xs font-semibold text-indigo-600 py-2 mt-2 border-t border-slate-100 hover:text-indigo-800"
              >
                Ver todos los eventos
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Proximas fechas clave</h3>
              <div className="space-y-2">
                {upcomingDates.map((item) => {
                  const isUrgent = item.priority === "URGENT" || item.priority === "CRITICAL";
                  return (
                    <button
                      key={item.id}
                      onClick={() => setDetailItemId(item.id)}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-1 h-8 rounded-full shrink-0 mt-0.5 ${isUrgent ? "bg-red-500" : ""}`} style={{ backgroundColor: isUrgent ? undefined : item.category?.color || "#6366F1" }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">
                            {item.startsAt ? new Date(item.startsAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : ""}
                          </span>
                          {isUrgent && <span className="text-[9px] font-bold text-red-600">URGENTE</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {upcomingDates.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No hay fechas proximas.</p>
                )}
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-600" />
                  <h3 className="text-sm font-bold text-red-800">Alertas</h3>
                </div>
                <div className="space-y-1.5">
                  {alerts.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => setDetailItemId(a.id)}
                      className="w-full text-left text-xs text-red-700 py-1 hover:text-red-900"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CalendarItemDetail
        itemId={detailItemId}
        onClose={() => setDetailItemId(null)}
        token={token}
        initialSaved={detailItemId ? savedIds.has(detailItemId) : false}
        onSavedChange={(itemId, isSaved) => {
          setSavedIds((prev) => {
            const next = new Set(prev);
            if (isSaved) next.add(itemId);
            else next.delete(itemId);
            return next;
          });
        }}
      />
    </div>
  );
}
