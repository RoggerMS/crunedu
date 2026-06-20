"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarItemApiItem } from "@/lib/api-helpers";

type CalendarWeekViewProps = {
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  items: CalendarItemApiItem[];
  onSelectEvent: (id: number) => void;
  onDayClick: (dateStr: string) => void;
};

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function CalendarWeekView({
  currentDate,
  onPrevWeek,
  onNextWeek,
  onToday,
  items,
  onSelectEvent,
  onDayClick,
}: CalendarWeekViewProps) {
  const { monday, sunday } = useMemo(() => getWeekRange(currentDate), [currentDate]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [monday]);

  const hours = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 6), []);

  const now = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth();
  const nowD = now.getDate();

  const todayStr = `${nowY}-${String(nowM + 1).padStart(2, "0")}-${String(nowD).padStart(2, "0")}`;

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItemApiItem[]> = {};
    items.forEach((item) => {
      if (item.startsAt) {
        const dateKey = item.startsAt.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(item);
      }
      item.occurrences?.forEach((occ) => {
        const dateKey = occ.startsAt.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(item);
      });
    });
    return map;
  }, [items]);

  const weekLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${monday.toLocaleDateString("es-ES", opts)} - ${sunday.toLocaleDateString("es-ES", opts)}`;
  }, [monday, sunday]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button onClick={onPrevWeek} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Semana anterior">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-base font-bold text-slate-900">{weekLabel}</h2>
          <button onClick={onNextWeek} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Semana siguiente">
            <ChevronRight size={18} className="text-slate-600" />
          </button>
        </div>
        <button onClick={onToday} className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">Hoy</button>
      </div>

      <div className="flex">
        <div className="w-14 shrink-0 border-r border-slate-100">
          <div className="h-10 border-b border-slate-100" />
          {hours.map((h) => (
            <div key={h} className="h-12 border-b border-slate-50 flex items-start justify-center pt-0.5">
              <span className="text-[10px] text-slate-400">{formatHour(h)}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, di) => {
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const dayItems = itemsByDate[dateStr] || [];
            const allDayItems = dayItems.filter((i) => i.allDay);
            const timedItems = dayItems.filter((i) => !i.allDay);
            const dayLabel = day.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 3);

            return (
              <div key={di} className="border-r border-slate-100 last:border-r-0">
                <div
                  className={`h-10 border-b border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 ${isToday ? "bg-indigo-50/50" : ""}`}
                  onClick={() => onDayClick(dateStr)}
                >
                  <span className="text-[10px] text-slate-500 uppercase">{dayLabel}</span>
                  <span className={`text-sm font-bold ${isToday ? "text-indigo-600" : "text-slate-800"}`}>{day.getDate()}</span>
                </div>
                <div className="relative">
                  {allDayItems.length > 0 && (
                    <div className="px-1 py-1 space-y-0.5 border-b border-slate-100">
                      {allDayItems.slice(0, 2).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onSelectEvent(item.id)}
                          className="w-full text-left truncate text-[10px] font-medium px-1 py-0.5 rounded"
                          style={{ backgroundColor: item.category?.color ? `${item.category.color}20` : "#EEF2FF", color: item.category?.color || "#6366F1" }}
                        >
                          {item.title}
                        </button>
                      ))}
                      {allDayItems.length > 2 && (
                        <span className="text-[9px] text-slate-400 px-1">+{allDayItems.length - 2}</span>
                      )}
                    </div>
                  )}
                  {hours.map((h) => {
                    const hourItems = timedItems.filter((item) => {
                      const startH = item.startsAt ? parseInt(item.startsAt.slice(11, 13)) : -1;
                      return startH === h;
                    });
                    return (
                      <div key={h} className="h-12 border-b border-slate-50 px-0.5 relative">
                        {hourItems.slice(0, 2).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onSelectEvent(item.id)}
                            className="w-full text-left truncate text-[9px] font-medium px-0.5 py-0.5 rounded leading-tight"
                            style={{ backgroundColor: item.category?.color ? `${item.category.color}20` : "#EEF2FF", color: item.category?.color || "#6366F1" }}
                          >
                            {item.startsAt?.slice(11, 16)} {item.title}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
