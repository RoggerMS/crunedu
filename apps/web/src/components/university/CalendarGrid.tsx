"use client";

import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MonthEventApiItem } from "@/lib/api-helpers";

export function CalendarGrid({
  currentDate,
  setCurrentDate,
  monthEvents = [],
  onSelectDay,
}: {
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  monthEvents?: MonthEventApiItem[];
  onSelectDay?: (dateStr: string) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

  const eventsByDate = React.useMemo(() => {
    const map: Record<string, MonthEventApiItem[]> = {};
    monthEvents.forEach((evt) => {
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
  }, [monthEvents]);

  const cells: { day: number; isCurrentMonth: boolean; dateStr: string; events: MonthEventApiItem[] }[] = [];
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
    cells.push({ day, isCurrentMonth, dateStr, events: eventsByDate[dateStr] || [] });
  }

  const prevMonth = useCallback(() => setCurrentDate(new Date(year, month - 1, 1)), [year, month, setCurrentDate]);
  const nextMonth = useCallback(() => setCurrentDate(new Date(year, month + 1, 1)), [year, month, setCurrentDate]);
  const goToday = useCallback(() => setCurrentDate(new Date()), [setCurrentDate]);

  const label = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const uniqueCategories = React.useMemo(() => {
    const seen = new Set<string>();
    return monthEvents.filter((e) => {
      const key = e.category?.name || "";
      if (seen.has(key) || !key) return false;
      seen.add(key);
      return true;
    }).map((e) => ({ name: e.category.name, color: e.category.color, icon: e.category.icon }));
  }, [monthEvents]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center px-3 md:px-4 py-2 border-b border-gray-100">
        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={prevMonth} aria-label="Mes anterior">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 capitalize">{label}</span>
          <button className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md transition-colors" onClick={goToday}>Hoy</button>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" onClick={nextMonth} aria-label="Mes siguiente">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1.5 text-center text-[10px] md:text-xs font-semibold text-gray-500 border-b border-gray-100">{day}</div>
        ))}
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const maxVisible = window.innerWidth < 768 ? 1 : 2;
          const visibleEvents = cell.events.slice(0, maxVisible);
          const remainingCount = cell.events.length - visibleEvents.length;

          return (
            <div
              key={idx}
              tabIndex={cell.isCurrentMonth ? 0 : -1}
              role="button"
              aria-label={`${cell.day} de ${label}${cell.events.length ? `, ${cell.events.length} evento${cell.events.length > 1 ? "s" : ""}` : ""}`}
              className={`min-h-[60px] md:min-h-[90px] border-b border-r border-gray-100 p-1 md:p-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 ${!cell.isCurrentMonth ? "bg-gray-50/50 opacity-40" : "hover:bg-gray-50"} ${isSelected ? "bg-indigo-50/50" : ""}`}
              onClick={() => {
                if (cell.isCurrentMonth) {
                  setSelectedDate(cell.dateStr);
                  onSelectDay?.(cell.dateStr);
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedDate(cell.dateStr); onSelectDay?.(cell.dateStr); } }}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[11px] md:text-sm font-medium w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white text-[10px] md:text-xs" : "text-gray-700"}`}>
                  {cell.day}
                </span>
              </div>
              <div className="mt-0.5 md:mt-1 space-y-0.5">
                {visibleEvents.map((evt, eidx) => (
                  <div key={eidx} className="flex items-center gap-1 px-1 py-0.5 rounded" style={{ backgroundColor: evt.category?.color ? `${evt.category.color}15` : "#EEF2FF" }}>
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0" style={{ backgroundColor: evt.category?.color || "#6366F1" }} />
                    <span className="text-[9px] md:text-[10px] font-medium truncate leading-tight" style={{ color: evt.category?.color || "#6366F1" }}>{evt.title}</span>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="text-[9px] md:text-[10px] font-medium text-gray-400 px-1">+{remainingCount} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {uniqueCategories.length > 0 && (
        <div className="px-3 md:px-4 py-2.5 bg-gray-50/50 flex gap-3 md:gap-4 flex-wrap text-[11px] md:text-xs text-gray-500">
          {uniqueCategories.map((cat) => (
            <span key={cat.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: cat.color || "#6B7280" }} />
              {cat.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
