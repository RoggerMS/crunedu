"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, AlertTriangle, Bookmark, ExternalLink, SlidersHorizontal, Search, X, ChevronRight, Clock, MapPin, FileText, Megaphone, Calendar, Building2, GraduationCap, Award, Palette, Trophy, Heart, Wallet, Library, Briefcase, Filter, List, LayoutGrid } from "lucide-react";
import { useUniversity } from "@/hooks/useUniversity";
import { CalendarGrid } from "@/components/university/CalendarGrid";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getUniversityOverview, getUniversityMonthEvents, getUniversityCategories, toggleSaveContent, type OverviewApiResponse, type MonthEventApiItem, type ContentCategoryApiItem } from "@/lib/api-helpers";
import type { UniversityItem } from "@/components/university/types";

const categoryIcons: Record<string, React.ElementType> = {
  tramites: FileText, convocatorias: Megaphone, eventos: Calendar, servicios: Building2,
  academico: GraduationCap, becas: Award, cultura: Palette, deportes: Trophy,
  bienestar: Heart, pagos: Wallet, biblioteca: Library, empleabilidad: Briefcase,
};

const typeLabels: Record<string, string> = {
  TRAMITE: "Trámites", CONVOCATORIA: "Convocatorias", EVENTO: "Eventos",
  SERVICIO: "Servicios", GUIA: "Guías", AVISO: "Comunicados",
};

const areaFilters = [
  { id: "", label: "Todas las áreas" },
  { id: "Académico", label: "Académico" },
  { id: "Administrativo", label: "Administrativo" },
  { id: "Bienestar", label: "Bienestar" },
  { id: "Cultura", label: "Cultura" },
  { id: "Biblioteca", label: "Biblioteca" },
  { id: "Investigación", label: "Investigación" },
];

export default function UniversityHubPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { accessToken: token } = useAccessToken();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSuggest, setShowSuggest] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showListing, setShowListing] = useState(false);
  const [helpFilter, setHelpFilter] = useState("Todos");
  const [helpQuery, setHelpQuery] = useState("");

  const [overview, setOverview] = useState<OverviewApiResponse | null>(null);
  const [monthEvents, setMonthEvents] = useState<MonthEventApiItem[]>([]);
  const [categories, setCategories] = useState<ContentCategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");

  const selectedType = params.get("tipo") || "";
  const selectedArea = params.get("area") || "";
  const selectedPriority = params.get("prioridad") || "";

  const { items, setSelectedFilter, selectedDay, setSelectedDay, showToast, toast, addSuggestion, saveDraft } = useUniversity(params.get("q") ?? "");

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, monthData, cats] = await Promise.all([
        getUniversityOverview(),
        getUniversityMonthEvents(currentDate.getFullYear(), currentDate.getMonth() + 1),
        getUniversityCategories(),
      ]);
      setOverview(overviewData);
      setMonthEvents(monthData);
      setCategories(cats);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v); else newParams.delete(k);
    });
    router.push(`/app/universidad?${newParams.toString()}`);
  };

  const clearFilters = () => router.push("/app/universidad");

  const filteredItems = items.filter((item) => {
    if (selectedType && item.type.toUpperCase() !== selectedType) return false;
    if (selectedArea && !item.area.toLowerCase().includes(selectedArea.toLowerCase())) return false;
    if (selectedPriority === "urgente" && !item.status?.includes("urgente")) return false;
    if (selectedPriority === "proximo_cierre" && !item.status?.includes("proximo_cierre")) return false;
    return true;
  });

  const contacts = [
    { name: "Secretaría Académica", area: "Secretaría", desc: "Consultas académicas y constancias", email: "secretaria@crunedu.local", schedule: "Lun-Vie 8:00 a. m. - 5:00 p. m.", location: "Pabellón A" },
    { name: "Tesorería", area: "Tesorería", desc: "Pagos y estados de cuenta", email: "tesoreria@crunedu.local", schedule: "Lun-Vie 9:00 a. m. - 4:30 p. m.", location: "Pabellón B" },
    { name: "Bienestar Universitario", area: "Bienestar", desc: "Becas y apoyo estudiantil", email: "bienestar@crunedu.local", schedule: "Lun-Vie 8:30 a. m. - 5:00 p. m.", location: "Edificio Bienestar" },
    { name: "Biblioteca", area: "Biblioteca", desc: "Préstamos y recursos", email: "biblioteca@crunedu.local", schedule: "Lun-Sáb 8:00 a. m. - 8:00 p. m.", location: "Biblioteca central" },
    { name: "Mesa de partes", area: "Trámites", desc: "Recepción de documentos", email: "mesadepartes@crunedu.local", schedule: "Lun-Vie 8:00 a. m. - 4:00 p. m.", location: "Entrada principal" },
  ];

  if (showListing) {
    return (
      <section className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <button onClick={() => setShowListing(false)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">← Volver al Hub</button>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-3">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar trámites, eventos, servicios..." className="flex-1 text-sm border-0 outline-none bg-transparent" />
              {searchQuery && <button onClick={() => setSearchQuery("")}><X size={16} className="text-gray-400" /></button>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(typeLabels).map(([key, label]) => (
                <button key={key} onClick={() => updateFilters({ tipo: selectedType === key ? "" : key })} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedType === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredItems.length ? filteredItems.map((item: UniversityItem) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/app/universidad/${item.id}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">{item.type[0]?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] font-medium text-gray-400 uppercase">{item.type}</span>
                          {item.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.category}</span>}
                          {item.location && <span className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10} />{item.location}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleSaveContent(Number(item.id), token || "").then(() => showToast(item.viewerState?.saved ? "Eliminado de guardados" : "Guardado")); }} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100"><Bookmark size={16} className={item.viewerState?.saved ? "text-indigo-600 fill-indigo-600" : "text-gray-400"} /></button>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border bg-white p-8 text-center">
                  <p className="text-sm text-slate-600">No hay información disponible para estos filtros.</p>
                  <button onClick={() => setShowSuggest(true)} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Sugerir información</button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Filtros</h3>
              <div className="space-y-3">
                <div><p className="text-xs font-medium text-gray-500 mb-1.5">Área</p><div className="flex flex-wrap gap-1.5">{areaFilters.map((a) => (<button key={a.id} onClick={() => updateFilters({ area: selectedArea === a.id ? "" : a.id })} className={`px-2 py-1 rounded text-xs font-medium ${selectedArea === a.id ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}>{a.label}</button>))}</div></div>
                <div><p className="text-xs font-medium text-gray-500 mb-1.5">Prioridad</p>{["urgente", "proximo_cierre"].map((p) => (<button key={p} onClick={() => updateFilters({ prioridad: selectedPriority === p ? "" : p })} className={`block w-full text-left px-2 py-1 rounded text-xs font-medium ${selectedPriority === p ? "bg-red-50 text-red-700" : "text-gray-500 hover:bg-gray-50"}`}>{p === "urgente" ? "Urgentes" : "Próximo cierre"}</button>))}</div>
                {(selectedType || selectedArea || selectedPriority) && <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Limpiar filtros</button>}
              </div>
            </div>
            <button onClick={() => setShowSuggest(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">Sugerir información</button>
          </div>
        </div>
        {showSuggest ? <SuggestModal onClose={() => setShowSuggest(false)} onDraft={saveDraft} onSend={addSuggestion} /> : null}
        {toast ? <Toast message={toast} /> : null}
      </section>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <aside className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4"><GraduationCap size={24} /></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Universidad</h1>
          <p className="text-sm text-gray-500 mb-5">Todo sobre trámites, fechas, convocatorias, eventos y servicios universitarios.</p>
          <button onClick={() => setShowSuggest(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">Sugerir información</button>
          <div className="mt-3 flex flex-col gap-1">
            <button onClick={() => router.push("/app/universidad/calendario")} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"><CalendarDays size={16} className="mr-2.5" /> Calendario</button>
            <button onClick={() => { updateFilters({ tipo: "" }); setShowListing(true); }} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"><List size={16} className="mr-2.5" /> Ver listado completo</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Categorías</h3>
          <div className="flex flex-col gap-1">
            {categories.slice(0, 8).map((cat) => {
              const Icon = categoryIcons[cat.slug] || FileText;
              return (
                <button key={cat.id} onClick={() => { updateFilters({ tipo: cat.name.toUpperCase() }); setShowListing(true); }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Icon size={15} style={{ color: cat.color }} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <CalendarGrid currentDate={currentDate} setCurrentDate={setCurrentDate} monthEvents={monthEvents} onSelectDay={(dateStr) => router.push(`/app/universidad/calendario/${dateStr}`)} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Agenda destacada</h3>
            <button onClick={() => router.push("/app/universidad/calendario")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Ver calendario completo →</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : overview?.upcomingEvents?.length ? (
            <div className="space-y-2">
              {overview.upcomingEvents.slice(0, 5).map((evt: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/app/universidad/${evt.id || idx}`)}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: evt.category?.color || "#6366F1" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{evt.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(evt.startsAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                      {evt.location && <span className="flex items-center gap-1"><MapPin size={11} />{evt.location}</span>}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay eventos próximos.</p>
          )}
        </div>
      </main>

      <aside className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
        {overview?.alerts?.slice(0, 1).map((alert: any, idx: number) => (
          <div key={idx} className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-medium text-red-900 text-sm">{alert.title}</h4>
                {alert.daysRemaining !== null && <p className="text-xs text-red-700 mt-1">{alert.daysRemaining <= 0 ? "Vence hoy" : `Vence en ${alert.daysRemaining} día${alert.daysRemaining !== 1 ? "s" : ""}`}</p>}
                <button onClick={() => router.push("/app/tramites")} className="text-xs font-medium text-red-700 mt-2 hover:text-red-800">Ir al trámite →</button>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Fechas importantes</h3>
          {overview?.upcomingDates?.length ? (
            <div className="space-y-3">
              {overview.upcomingDates.slice(0, 4).map((d: any, idx: number) => (
                <div key={idx} className="flex gap-3 relative before:absolute before:left-[11px] before:top-7 before:bottom-[-12px] before:w-[1px] before:bg-gray-100 last:before:hidden">
                  <div className="w-6 h-6 rounded-full bg-gray-50 border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.category?.color || "#6366F1" }} />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{d.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.startsAt ? new Date(d.startsAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-3">No hay fechas próximas.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Más consultado</h3>
          <div className="space-y-1">
            {overview?.mostConsulted?.slice(0, 5).map((item: any, idx: number) => (
              <button key={idx} onClick={() => router.push(`/app/universidad/${item.id}`)} className="flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Áreas universitarias</h3>
          <div className="space-y-1">
            {overview?.areas?.slice(0, 6).map((area: any) => (
              <button key={area.id} onClick={() => { updateFilters({ area: area.name }); setShowListing(true); }} className="flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{area.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setShowHelp(true)} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm">Ayuda y contacto</button>
      </aside>

      {showSuggest ? <SuggestModal onClose={() => setShowSuggest(false)} onDraft={saveDraft} onSend={addSuggestion} /> : null}
      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}

function SuggestModal({ onClose, onDraft, onSend }: { onClose: () => void; onDraft: (payload: unknown) => void; onSend: (payload: any) => void }) {
  const [form, setForm] = useState({ type: "tramite", title: "", description: "", area: "", date: "", location: "", externalUrl: "" });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5">
        <h2 className="text-xl font-bold">Sugerir información</h2>
        <p className="text-sm text-slate-600 mt-1">Comparte información útil para toda la comunidad universitaria.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {["evento", "tramite", "convocatoria", "servicio", "comunicado", "correccion", "fecha-importante"].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1).replace("-", " ")}</option>)}
          </select>
          <input className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Área relacionada" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
          <input className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:col-span-2" placeholder="Título" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:col-span-2" placeholder="Descripción" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input type="date" className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <input className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ubicación" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <input className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:col-span-2" placeholder="Enlace opcional" value={form.externalUrl} onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
          <button onClick={() => onDraft(form)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Guardar borrador</button>
          <button onClick={() => { onSend({ type: form.type, title: form.title, description: form.description, area: form.area || undefined, date: form.date || undefined, location: form.location || undefined, externalUrl: form.externalUrl || undefined }); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Enviar sugerencia</button>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const [helpFilter, setHelpFilter] = useState("Todos");
  const [helpQuery, setHelpQuery] = useState("");
  const contacts = [
    { name: "Secretaría Académica", area: "Secretaría", desc: "Consultas académicas y constancias", email: "secretaria@crunedu.local", schedule: "Lun-Vie 8:00 a. m. - 5:00 p. m.", location: "Pabellón A" },
    { name: "Tesorería", area: "Tesorería", desc: "Pagos y estados de cuenta", email: "tesoreria@crunedu.local", schedule: "Lun-Vie 9:00 a. m. - 4:30 p. m.", location: "Pabellón B" },
    { name: "Bienestar Universitario", area: "Bienestar", desc: "Becas y apoyo estudiantil", email: "bienestar@crunedu.local", schedule: "Lun-Vie 8:30 a. m. - 5:00 p. m.", location: "Edificio Bienestar" },
    { name: "Biblioteca", area: "Biblioteca", desc: "Préstamos y recursos", email: "biblioteca@crunedu.local", schedule: "Lun-Sáb 8:00 a. m. - 8:00 p. m.", location: "Biblioteca central" },
    { name: "Mesa de partes", area: "Trámites", desc: "Recepción de documentos", email: "mesadepartes@crunedu.local", schedule: "Lun-Vie 8:00 a. m. - 4:00 p. m.", location: "Entrada principal" },
    { name: "Soporte técnico", area: "Soporte", desc: "Soporte de sistemas", email: "soporte@crunedu.local", schedule: "Lun-Vie 8:00 a. m. - 6:00 p. m.", location: "Centro TIC" },
  ];
  const filteredContacts = contacts.filter((c) => (helpFilter === "Todos" || c.area === helpFilter) && `${c.name} ${c.desc}`.toLowerCase().includes(helpQuery.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5">
        <h2 className="text-xl font-bold">Ayuda y contacto</h2>
        <p className="text-sm text-slate-600">Encuentra el contacto correcto según el área o trámite que necesitas.</p>
        <input value={helpQuery} onChange={(e) => setHelpQuery(e.target.value)} placeholder="Buscar área o trámite" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" />
        <div className="mt-2 flex flex-wrap gap-2">
          {["Todos", "Secretaría", "Tesorería", "Bienestar", "Biblioteca", "Soporte", "Trámites"].map((f) => (
            <button key={f} onClick={() => setHelpFilter(f)} className={`rounded-full border px-2 py-1 text-xs ${helpFilter === f ? "bg-indigo-600 text-white" : "bg-white"}`}>{f}</button>
          ))}
        </div>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {filteredContacts.map((c) => (
            <div key={c.name} className="rounded-xl border p-3 text-sm">
              <p className="font-semibold">{c.name}</p>
              <p className="text-slate-600 text-xs">{c.desc}</p>
              <p className="text-xs text-slate-500 mt-1">{c.schedule} · {c.location}</p>
              <button onClick={() => { navigator.clipboard.writeText(c.email); }} className="mt-2 bg-gray-100 hover:bg-gray-200 rounded px-2.5 py-1 text-xs font-medium transition-colors">Copiar correo</button>
            </div>
          ))}
        </div>
        <button className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg z-50">{message}</div>;
}
