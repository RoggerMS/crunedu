"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, MapPin, AlertTriangle, Star, Bookmark, BookmarkCheck } from "lucide-react";
import { getUniversityDayEvents, saveCalendarItem, removeSavedCalendarItem } from "@/lib/api-helpers";
import { CalendarItemDetail } from "@/components/university/CalendarItemDetail";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("accessToken") || null;
  } catch { return null; }
}

export default function UniversidadAgendaDiaPage() {
  const params = useParams<{ date: string }>();
  const { date } = params;

  const [items, setItems] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const token = useMemo(() => getToken(), []);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getUniversityDayEvents(date)
      .then((data) => {
        setItems(data.items || []);
        setOccurrences(data.occurrences || []);
      })
      .catch(() => { setItems([]); setOccurrences([]); })
      .finally(() => setLoading(false));
  }, [date]);

  const allEvents = useMemo(() => {
    const result = [...items];
    occurrences.forEach((occ: any) => {
      if (!result.find((r) => r.id === occ.id && r.type === "occurrence")) {
        result.push({ ...occ, _isOccurrence: true });
      }
    });
    result.sort((a, b) => {
      const aD = a.startsAt || "";
      const bD = b.startsAt || "";
      return aD.localeCompare(bD);
    });
    return result;
  }, [items, occurrences]);

  const dateFormatted = useMemo(() => {
    try {
      const d = new Date(date + "T12:00:00");
      return d.toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  const handleToggleSave = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      if (savedIds.has(id)) {
        await removeSavedCalendarItem(id, token);
        setSavedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await saveCalendarItem(id, token);
        setSavedIds((prev) => { const n = new Set(prev); n.add(id); return n; });
      }
    } catch {}
  };

  return (
    <section className="space-y-4">
      <Link
        href="/app/universidad/calendario"
        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft size={16} />
        Volver al calendario
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Agenda del dia</h1>
            <p className="mt-1 text-sm capitalize text-slate-600">{dateFormatted}</p>
          </div>
          <Link
            href={`/app/universidad/calendario?view=month&date=${date?.slice(0, 7)}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Ver mes completo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : allEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
          <p className="text-sm text-slate-600">No hay eventos registrados para esta fecha.</p>
          <p className="mt-2 text-xs text-slate-500">
            ?Falta algun evento? Puedes sugerir informacion desde la seccion Universidad.
          </p>
          <Link
            href="/app/universidad"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ir a Universidad
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {allEvents.map((event: any, idx: number) => {
            const isUrgent = event.priority === "URGENT" || event.priority === "CRITICAL";
            const isSaved = savedIds.has(event.id || event.itemId);
            const eventId = event.id || event.itemId;
            return (
              <button
                key={event.id || event.itemId || idx}
                onClick={() => setDetailId(eventId)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-1 h-full min-h-[40px] rounded-full shrink-0 mt-1" style={{ backgroundColor: event.category?.color || "#6366F1" }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-slate-900">{event.title}</h2>
                        {isUrgent && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                        {event.isFeatured && <Star size={14} className="text-amber-500 shrink-0" />}
                      </div>
                      {event.summary && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{event.summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                        {event.startsAt && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(event.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                            {event.endsAt && ` - ${new Date(event.endsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                        )}
                        {(event.locationName || event.location) && (
                          <span className="flex items-center gap-1"><MapPin size={12} />{event.locationName || event.location}</span>
                        )}
                        {event.category?.name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (event.category.color || "#6366F1") + "15", color: event.category.color || "#6366F1" }}>
                            {event.category.name}
                          </span>
                        )}
                        {event.modality && (
                          <span className="capitalize text-[10px] text-slate-400">
                            {event.modality === "IN_PERSON" ? "Presencial" : event.modality === "ONLINE" ? "En linea" : event.modality === "HYBRID" ? "Mixto" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {token && (
                      <button
                        onClick={(e) => handleToggleSave(eventId, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isSaved ? "Quitar guardado" : "Guardar"}
                      >
                        {isSaved ? <BookmarkCheck size={16} className="text-indigo-600" /> : <Bookmark size={16} className="text-slate-400" />}
                      </button>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CalendarItemDetail
        itemId={detailId}
        onClose={() => setDetailId(null)}
        token={token}
      />
    </section>
  );
}
