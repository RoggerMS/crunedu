"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Clock, MapPin, Globe, ExternalLink, Bookmark, BookmarkCheck, Bell, Download, Share2, Calendar, AlertTriangle, FileText } from "lucide-react";
import type { CalendarItemDetailApiItem } from "@/lib/api-helpers";
import { getUniversityCalendarItemById, saveCalendarItem, removeSavedCalendarItem, createContentReminder, buildCalendarItemIcsUrl } from "@/lib/api-helpers";

type CalendarItemDetailProps = {
  itemId: number | null;
  onClose: () => void;
  token: string | null;
};

const REMINDER_OPTIONS = [
  { label: "15 minutos antes", minutes: 15 },
  { label: "30 minutos antes", minutes: 30 },
  { label: "1 hora antes", minutes: 60 },
  { label: "1 dia antes", minutes: 1440 },
  { label: "3 dias antes", minutes: 4320 },
  { label: "1 semana antes", minutes: 10080 },
];

export function CalendarItemDetail({ itemId, onClose, token }: CalendarItemDetailProps) {
  const [item, setItem] = useState<CalendarItemDetailApiItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!itemId) { setItem(null); return; }
    setLoading(true);
    setError(null);
    setSaved(false);
    setReminderMsg(null);
    getUniversityCalendarItemById(itemId)
      .then((data) => { setItem(data); })
      .catch((err) => { setError(err?.message || "Error al cargar detalle."); })
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (itemId) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [itemId, onClose]);

  const handleSave = useCallback(async () => {
    if (!item || !token) return;
    setSaving(true);
    try {
      if (saved) {
        await removeSavedCalendarItem(item.id, token);
        setSaved(false);
      } else {
        await saveCalendarItem(item.id, token);
        setSaved(true);
      }
    } catch { setReminderMsg("Error al guardar."); }
    setSaving(false);
  }, [item, token, saved]);

  const handleReminder = useCallback(async (minutes: number) => {
    if (!item || !token || !item.startsAt) return;
    const startsAt = new Date(item.startsAt);
    const remindAt = new Date(startsAt.getTime() - minutes * 60000);
    if (remindAt <= new Date()) {
      setReminderMsg("La fecha de recordatorio ya paso.");
      return;
    }
    try {
      await createContentReminder(item.id, remindAt.toISOString(), token);
      setReminderMsg("Recordatorio creado.");
    } catch (err: any) {
      setReminderMsg(err?.message || "Error al crear recordatorio.");
    }
  }, [item, token]);

  const handleShare = useCallback(async () => {
    if (!item) return;
    const url = `${window.location.origin}/app/universidad?item=${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setReminderMsg("Enlace copiado.");
    } catch {
      setReminderMsg("No se pudo copiar el enlace.");
    }
  }, [item]);

  if (!itemId) return null;

  const priorityColors: Record<string, string> = {
    URGENT: "text-red-600 bg-red-50",
    CRITICAL: "text-red-700 bg-red-100",
    IMPORTANT: "text-amber-600 bg-amber-50",
    NORMAL: "text-slate-500 bg-slate-100",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[85vh]">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 truncate pr-4">
            {loading ? "Cargando..." : item?.title || "Detalle"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {loading && (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-20 bg-slate-100 rounded" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
        )}

        {error && (
          <div className="p-6">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {item && !loading && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              {item.category && (
                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: item.category.color + "15", color: item.category.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.category.color }} />
                  {item.category.name}
                </span>
              )}
              {item.priority && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${priorityColors[item.priority] || priorityColors.NORMAL}`}>
                  {item.priority === "URGENT" ? "URGENTE" : item.priority === "CRITICAL" ? "CRITICO" : item.priority === "IMPORTANT" ? "IMPORTANTE" : "NORMAL"}
                </span>
              )}
              {item.isFeatured && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">DESTACADO</span>
              )}
              {item.status && (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.status}</span>
              )}
            </div>

            {item.summary && (
              <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {item.startsAt && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">Inicio</span>
                    <p className="text-slate-600">
                      {new Date(item.startsAt).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {!item.allDay && ` ${new Date(item.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
                      {item.allDay && " (Todo el dia)"}
                    </p>
                  </div>
                </div>
              )}
              {item.endsAt && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">Cierre</span>
                    <p className="text-slate-600">
                      {new Date(item.endsAt).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {!item.allDay && ` ${new Date(item.endsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                </div>
              )}
              {item.locationName && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">Lugar</span>
                    <p className="text-slate-600">{item.locationName}</p>
                  </div>
                </div>
              )}
              {item.modality && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Globe size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">Modalidad</span>
                    <p className="text-slate-600 capitalize">{item.modality === "IN_PERSON" ? "Presencial" : item.modality === "ONLINE" ? "En linea" : item.modality === "HYBRID" ? "Mixto" : "No aplica"}</p>
                  </div>
                </div>
              )}
              {item.area && (
                <div className="flex items-start gap-2.5 text-sm">
                  <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">Area responsable</span>
                    <p className="text-slate-600">{item.area.name}</p>
                  </div>
                </div>
              )}
              {item.price !== null && item.price > 0 && (
                <div className="flex items-start gap-2.5 text-sm">
                  <span className="text-slate-400 mt-0.5 shrink-0 text-base">S/</span>
                  <div>
                    <span className="font-medium text-slate-700">Costo</span>
                    <p className="text-slate-600">S/ {item.price.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            {item.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Descripcion</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{item.description}</p>
              </div>
            )}

            {item.occurrences && item.occurrences.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Ocurrencias ({item.occurrences.length})</h3>
                <div className="space-y-1.5">
                  {item.occurrences.map((occ) => (
                    <div key={occ.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Clock size={12} />
                      <span>{new Date(occ.startsAt).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                        {!occ.allDay && ` ${new Date(occ.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                      {occ.locationName && <><span>-</span><MapPin size={12} /><span>{occ.locationName}</span></>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
              {token && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {saved ? <BookmarkCheck size={14} className="text-indigo-600" /> : <Bookmark size={14} />}
                  {saved ? "Guardado" : "Guardar"}
                </button>
              )}

              {token && item.startsAt && (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <Bell size={14} />
                    Recordatorio
                  </button>
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[180px]">
                      {REMINDER_OPTIONS.map((opt) => (
                        <button
                          key={opt.minutes}
                          onClick={() => handleReminder(opt.minutes)}
                          className="block w-full text-left text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 text-slate-700"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <a
                href={buildCalendarItemIcsUrl(item.id)}
                download
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Download size={14} />
                ICS
              </a>

              <a
                href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${item.startsAt ? new Date(item.startsAt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : ""}/${item.endsAt ? new Date(item.endsAt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : ""}&details=${encodeURIComponent(item.description || "")}&location=${encodeURIComponent(item.locationName || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Calendar size={14} />
                Google Calendar
              </a>

              <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <Share2 size={14} />
                Compartir
              </button>

              {item.officialUrl && (
                <a
                  href={item.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink size={14} />
                  Sitio oficial
                </a>
              )}
            </div>

            {reminderMsg && (
              <div className="rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-700">{reminderMsg}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
