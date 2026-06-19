import { Flame, Gift, PackageSearch, Rocket, Truck, Wrench } from "lucide-react";

const radarItems = [
  { label: "Entrega hoy", hint: "28 publicaciones", icon: Truck, query: "Entrega hoy" },
  { label: "Para parciales", hint: "16 resultados", icon: PackageSearch, query: "materiales" },
  { label: "Más buscado", hint: "Calculadoras y separatas", icon: Flame, query: "calculadora" },
  { label: "Donaciones", hint: "7 apoyos activos", icon: Gift, query: "donación" },
  { label: "Servicios", hint: "12 servicios", icon: Wrench, query: "servicio" },
  { label: "Emprendimientos", hint: "9 propuestas", icon: Rocket, query: "emprendimiento" },
];

export function StoreAcademicRadar({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {radarItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.query)}
            className="flex min-h-[64px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50 p-2.5 text-left transition hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <Icon className="h-4 w-4 shrink-0 text-indigo-600" />
              <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{item.label}</p>
            </div>
            <p className="mt-0.5 min-w-0 truncate text-xs text-slate-600">{item.hint}</p>
          </button>
        );
      })}
    </div>
  );
}
