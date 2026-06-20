"use client";

import React from "react";
import { Filter, AlertTriangle, Star, Clock } from "lucide-react";

const filters = [
  { id: "todo", label: "Todo", icon: Filter },
  { id: "urgente", label: "Urgente", icon: AlertTriangle },
  { id: "importante", label: "Importante", icon: Star },
  { id: "proximo", label: "Próximo", icon: Clock },
];

export function UniversityPriorityFilters({
  selected = "todo",
  onChange,
}: {
  selected?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Filtros rápidos
      </h3>
      <div className="flex flex-col gap-1.5">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = selected === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onChange?.(f.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
