"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import type { MonthEventApiItem, ContentCategoryApiItem } from "@/lib/api-helpers";

type CalendarMonthViewProps = {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  monthEvents: MonthEventApiItem[];
  categories: ContentCategoryApiItem[];
  activeCategoryIds: Set<number>;
  onToggleCategory: (id: number) => void;
  onSelectDay: (dateStr: string) => void;
  onDayDoubleClick: (dateStr: string) => void;
  selectedDate: string | null;
};

export function CalendarMonthView({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  monthEvents,
  categories,
  activeCategoryIds,
  onToggleCategory,
  onSelectDay,
  onDayDoubleClick,
  selectedDate,
}: CalendarMonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysOfWeek = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

  const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

  const eventsByDate = useMemo(() => {
    const map: Record<string, MonthEventApiItem[]> = {};
    monthEvents.forEach((evt) => {
      if (!activeCategoryIds.has(evt.category?.id || 0) && activeCategoryIds.size < categories.length) return;
      if (evt.startsAt) {
        const dateKey = evt.startsAt.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(evt);
      }
      evt.occurrences?.forEach((occ) => {
        const dateKey = occ.startsAt.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(evt);
      });
    });
    return map;
  }, [monthEvents, activeCategoryIds, categories.length]);

  const [popoverDay, setPopoverDay] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverDay(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopoverDay(null);
    };
    if (popoverDay) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [popoverDay]);

  const label = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const result: { day: number; isCurrentMonth: boolean; dateStr: string; events: MonthEventApiItem[] }[] = [];
    for (let i = 0; i < totalCells; i++) {
      let day: number;
      let isCurrentMonth: boolean;
      if (i < startDayOfWeek) {
        day = daysInPrevMonth - startDayOfWeek + i + 1;
        isCurrentMonth = false;
      } else if (i >= startDayOfWeek + daysInMonth) {
        day = i - (startDayOfWeek + daysInMonth) + 1;
        isCurrentMonth = false;
      } else {
        day = i - startDayOfWeek + 1;
        isCurrentMonth = true;
      }
      const m = isCurrentMonth ? month : i < startDayOfWeek ? month - 1 : month + 1;
      const y = m < 0 ? year - 1 : m > 11 ? year + 1 : year;
      const adjustedM = ((m % 12) + 12) % 12;
      const dateStr = `${y}-${String(adjustedM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      result.push({ day, isCurrentMonth, dateStr, events: eventsByDate[dateStr] || [] });
    }
    return result;
  }, [totalCells, startDayOfWeek, daysInMonth, daysInPrevMonth, year, month, eventsByDate]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Mes anterior">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 capitalize">{label}</h2>
          <button onClick={onToday} className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">Hoy</button>
        </div>
        <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Mes siguiente">
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 border-b border-slate-100">
            {day}
          </div>
        ))}
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const visibleEvents = cell.events.slice(0, 3);
          const remainingCount = cell.events.length - visibleEvents.length;

          return (
            <div
              key={idx}
              className={`min-h-[80px] md:min-h-[100px] border-b border-r border-slate-100 p-1.5 transition-colors cursor-pointer select-none
                ${!cell.isCurrentMonth ? "bg-slate-50/50 opacity-40 pointer-events-none" : "hover:bg-slate-50"}
                ${isSelected ? "bg-indigo-50/60 ring-1 ring-inset ring-indigo-200" : ""}
              `}
              onClick={() => {
                if (cell.isCurrentMonth) {
                  onSelectDay(cell.dateStr);
                }
              }}
              onDoubleClick={() => {
                if (cell.isCurrentMonth) onDayDoubleClick(cell.dateStr);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? "bg-indigo-600 text-white" : isSelected ? "text-indigo-700" : "text-slate-700"}
                `}>
                  {cell.day}
                </span>
                {cell.events.length > visibleEvents.length && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPopoverDay(cell.dateStr); }}
                    className="text-[10px] font-medium text-indigo-500 hover:text-indigo-700"
                  >
                    +{cell.events.length - visibleEvents.length}
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {visibleEvents.map((evt, eidx) => (
                  <div
                    key={eidx}
                    title={`${evt.title}`}
                    className="flex items-center gap-1 px-1 py-0.5 rounded truncate"
                    style={{ backgroundColor: evt.category?.color ? `${evt.category.color}15` : "#EEF2FF" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: evt.category?.color || "#6366F1" }} />
                    <span className="text-[10px] font-medium truncate leading-tight" style={{ color: evt.category?.color || "#6366F1" }}>
                      {evt.allDay ? "" : evt.startsAt?.slice(11, 16) + " "}{evt.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {popoverDay && eventsByDate[popoverDay] && eventsByDate[popoverDay].length > 3 && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-sm w-full max-h-80 overflow-y-auto"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {new Date(popoverDay + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            <button onClick={() => setPopoverDay(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
          <div className="space-y-2">
            {eventsByDate[popoverDay].map((evt) => (
              <div key={evt.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: evt.category?.color || "#6366F1" }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{evt.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    {!evt.allDay && evt.startsAt && (
                      <span className="flex items-center gap-1"><Clock size={10} />{evt.startsAt.slice(11, 16)}</span>
                    )}
                    {evt.category?.name && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: evt.category.color + "20", color: evt.category.color }}>
                        {evt.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-2.5 bg-slate-50/50 flex items-center gap-2 flex-wrap text-xs">
        {categories.map((cat) => {
          const isActive = activeCategoryIds.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onToggleCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors
                ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}
              `}
              style={{ backgroundColor: cat.color ? `${cat.color}15` : "#F1F5F9", color: cat.color || "#64748B" }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
              {cat.name}
            </button>
          );
        })}
        {categories.length > 0 && (
          <button
            onClick={() => {
              const allActive = categories.every((c) => activeCategoryIds.has(c.id));
              if (allActive) {
                categories.forEach((c) => { if (activeCategoryIds.has(c.id)) onToggleCategory(c.id); });
              } else {
                categories.forEach((c) => { if (!activeCategoryIds.has(c.id)) onToggleCategory(c.id); });
              }
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 ml-1"
          >
            {categories.every((c) => activeCategoryIds.has(c.id)) ? "Ocultar todas" : "Mostrar todas"}
          </button>
        )}
      </div>
    </div>
  );
}
