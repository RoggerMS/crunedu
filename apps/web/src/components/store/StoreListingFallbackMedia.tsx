import {
  Backpack,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  FileText,
  Gift,
  Laptop,
  Package,
  RefreshCw,
  Rocket,
  Shirt,
  Ticket,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StoreCategory } from "./types";

const categoryConfig: Record<StoreCategory, { icon: LucideIcon; label: string; gradient: string }> = {
  books: { icon: BookOpen, label: "Libros", gradient: "from-indigo-100 via-white to-blue-100" },
  printed_notes: { icon: FileText, label: "Separatas", gradient: "from-sky-100 via-white to-indigo-100" },
  calculators: { icon: Calculator, label: "Calculadoras", gradient: "from-amber-100 via-white to-orange-100" },
  technology: { icon: Laptop, label: "Tecnología", gradient: "from-slate-100 via-white to-indigo-100" },
  uniforms: { icon: Shirt, label: "Uniformes", gradient: "from-blue-100 via-white to-cyan-100" },
  materials: { icon: Backpack, label: "Materiales", gradient: "from-emerald-100 via-white to-sky-100" },
  food: { icon: Utensils, label: "Comida", gradient: "from-rose-100 via-white to-amber-100" },
  services: { icon: BriefcaseBusiness, label: "Servicios", gradient: "from-violet-100 via-white to-indigo-100" },
  business: { icon: Rocket, label: "Emprendimientos", gradient: "from-fuchsia-100 via-white to-rose-100" },
  events: { icon: Ticket, label: "Eventos", gradient: "from-orange-100 via-white to-rose-100" },
  exchange: { icon: RefreshCw, label: "Intercambios", gradient: "from-violet-100 via-white to-blue-100" },
  free: { icon: Gift, label: "Gratis", gradient: "from-emerald-100 via-white to-lime-100" },
};

export function StoreListingFallbackMedia({ category }: { category: StoreCategory }) {
  const config = categoryConfig[category] ?? { icon: Package, label: "Categoría", gradient: "from-slate-100 via-white to-slate-200" };
  const Icon = config.icon;

  return (
    <div className={`relative h-44 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${config.gradient}`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/70" />
      <div className="absolute -bottom-6 left-6 h-20 w-20 rounded-full bg-white/60" />
      <div className="relative flex h-full flex-col justify-between p-4 text-slate-700">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white/85 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">{config.label}</p>
      </div>
    </div>
  );
}
