import {
  BookMarked,
  Printer,
  Calculator,
  Package,
  Utensils,
  Gift,
  Repeat2,
  BriefcaseBusiness,
  Rocket,
  Laptop,
} from "lucide-react";
import { storeNeeds } from "./store-data";

const needIcons: Record<string, any> = {
  BookMarked, Printer, Calculator, Package, Utensils, Gift, Repeat2, BriefcaseBusiness, Rocket, Laptop,
};

export function StoreNeedShortcuts({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {storeNeeds.map((need) => {
        const isActive = active === need.id;
        const Icon = needIcons[need.iconKey] ?? Package;

        return (
          <button
            key={need.id}
            type="button"
            onClick={() => onSelect(need.id)}
            className={`flex min-h-[88px] min-w-0 flex-col overflow-hidden rounded-xl border p-2.5 text-left transition ${
              isActive
                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
            }`}
          >
            <div className="mb-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <p className="line-clamp-2 min-w-0 break-words text-xs font-bold leading-tight text-slate-900">
              {need.label}
            </p>
            <p className="line-clamp-1 min-w-0 break-words text-[11px] leading-tight text-slate-600">{need.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
