"use client";

import { useMemo } from "react";
import { Clock, MapPin } from "lucide-react";
import type { CalendarItemApiItem } from "@/lib/api-helpers";

type CalendarAgendaViewProps = {
  items: CalendarItemApiItem[];
  onSelectEvent: (id: number) => void;
  loading?: boolean;
};

function groupLabel(date: Date, today: Date): string {
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Manana";
  if (diff < 0) return "Pasados";
  if (diff <= 3) return "Proximos dias";
  return "Este mes";
}

export function CalendarAgendaView({ items, onSelectEvent, loading }: CalendarAgendaViewProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, CalendarItemApiItem[]> = {};
    const sorted = [...items].sort((a, b) => {
      const aD = a.startsAt || a.createdAt;
      const bD = b.startsAt || b.createdAt;
      return aD.localeCompare(bD);
    });

    sorted.forEach((item) => {
      const date = item.startsAt ? new Date(item.startsAt) : null;
      const label = date ? groupLabel(date, today) : "Sin fecha";
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [items, today]);

  const order = ["Hoy", "Manana", "Proximos dias", "Este mes", "Pasados", "Sin fecha"];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-16 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">No hay eventos en este periodo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Agenda</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {order.map((label) => {
          const groupItems = grouped[label];
          if (!groupItems || groupItems.length === 0) return null;
          return (
            <div key={label}>
              <div className="px-4 py-2 bg-slate-50/80">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              </div>
              {groupItems.map((item) => {
                const startDate = item.startsAt ? new Date(item.startsAt) : null;
                const isUrgent = item.priority === "URGENT" || item.priority === "CRITICAL";
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectEvent(item.id)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <div className="w-1 h-full min-h-[40px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: item.category?.color || "#6366F1" }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                        {isUrgent && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">URGENTE</span>
                        )}
                        {item.isFeatured && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">DESTACADO</span>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {startDate && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {startDate.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                            {!item.allDay && ` ${startDate.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                        )}
                        {item.locationName && (
                          <span className="flex items-center gap-1"><MapPin size={11} />{item.locationName}</span>
                        )}
                        {item.category?.name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: (item.category.color || "#6366F1") + "15", color: item.category.color || "#6366F1" }}>
                            {item.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
