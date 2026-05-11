import { Flame, Gift, PackageSearch, Rocket, Truck, Wrench } from "lucide-react";

const radarItems = [
  { label: "Entrega hoy en campus", hint: "28 publicaciones", icon: Truck, query: "Entrega hoy" },
  { label: "Materiales para parciales", hint: "16 resultados", icon: PackageSearch, query: "materiales" },
  { label: "Más buscado esta semana", hint: "Calculadoras y separatas", icon: Flame, query: "calculadora" },
  { label: "Donaciones activas", hint: "7 apoyos estudiantiles", icon: Gift, query: "donación" },
  { label: "Servicios disponibles ahora", hint: "12 servicios", icon: Wrench, query: "servicio" },
  { label: "Emprendimientos cerca de ti", hint: "9 propuestas", icon: Rocket, query: "emprendimiento" },
];

export function StoreAcademicRadar({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {radarItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.query)}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50 p-4 text-left transition hover:border-indigo-300 hover:shadow-sm"
          >
            <Icon className="mb-2 h-5 w-5 text-indigo-600" />
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="text-xs text-slate-600">{item.hint}</p>
          </button>
        );
      })}
    </div>
  );
}
