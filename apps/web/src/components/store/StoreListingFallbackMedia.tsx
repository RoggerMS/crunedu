import {
  Backpack,
  BookOpen,
  BookMarked,
  BriefcaseBusiness,
  Calculator,
  Gift,
  Laptop,
  Package,
  Printer,
  Repeat2,
  Rocket,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  BookMarked,
  Calculator,
  Backpack,
  Laptop,
  Printer,
  BriefcaseBusiness,
  Utensils,
  Rocket,
  Repeat2,
  Gift,
  Package,
};

const labelMap: Record<string, string> = {
  BookOpen: "Libros",
  BookMarked: "Libros",
  Calculator: "Calculadoras",
  Backpack: "Materiales",
  Laptop: "Tecnología",
  Printer: "Impresiones",
  BriefcaseBusiness: "Servicios",
  Utensils: "Alimentación",
  Rocket: "Emprendimientos",
  Repeat2: "Intercambios",
  Gift: "Donaciones",
  Package: "Materiales",
};

const gradientMap: Record<string, string> = {
  BookOpen: "from-indigo-100 via-white to-blue-100",
  BookMarked: "from-indigo-100 via-white to-blue-100",
  Calculator: "from-amber-100 via-white to-orange-100",
  Backpack: "from-emerald-100 via-white to-sky-100",
  Laptop: "from-slate-100 via-white to-indigo-100",
  Printer: "from-sky-100 via-white to-indigo-100",
  BriefcaseBusiness: "from-violet-100 via-white to-indigo-100",
  Utensils: "from-rose-100 via-white to-amber-100",
  Rocket: "from-fuchsia-100 via-white to-rose-100",
  Repeat2: "from-violet-100 via-white to-blue-100",
  Gift: "from-emerald-100 via-white to-lime-100",
  Package: "from-emerald-100 via-white to-sky-100",
};

export function StoreListingFallbackMedia({
  categorySlug,
  iconKey,
  compact = false,
}: {
  categorySlug?: string;
  iconKey?: string | null;
  compact?: boolean;
}) {
  const key = iconKey ?? "Package";
  const Icon = iconMap[key] ?? Package;
  const label = labelMap[key] ?? "Producto";
  const gradient = gradientMap[key] ?? "from-slate-100 via-white to-slate-200";

  return (
    <div
      className={`relative ${
        compact ? "h-full rounded-none border-0" : "h-44 rounded-2xl border border-slate-200"
      } overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/70" />
      <div className="absolute -bottom-6 left-6 h-20 w-20 rounded-full bg-white/60" />
      <div
        className={`relative flex h-full flex-col justify-between text-slate-700 ${
          compact ? "p-3" : "p-4"
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-xl border border-white bg-white/85 shadow-sm ${
            compact ? "h-9 w-9" : "h-11 w-11"
          }`}
        >
          <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </div>
        <p className={`${compact ? "text-xs" : "text-sm"} font-semibold`}>{label}</p>
      </div>
    </div>
  );
}
