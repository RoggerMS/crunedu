import { useEffect, useState } from "react";
import { MapPin, ShieldAlert, Search } from "lucide-react";
import type { StoreSafePoint } from "@/lib/api-helpers";
import { getStoreSafePoints } from "@/lib/api-helpers";

const trendingSearches = ["Calculadora científica", "Libro de Cálculo", "Separatas", "Impresiones", "Laptop"];

export function StoreSidebar({ onSearch, onSafePoint }: { onSearch: (q: string) => void; onSafePoint?: (id: string) => void }) {
  const [safePoints, setSafePoints] = useState<StoreSafePoint[]>([]);

  useEffect(() => {
    getStoreSafePoints()
      .then(setSafePoints)
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-3">
      {/* Safe points */}
      {safePoints.length > 0 && (
        <div className="rounded-2xl border bg-white p-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-600" />
            Puntos seguros
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {safePoints.map((sp) => (
              <li key={sp.id} className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
                <span className="font-medium text-slate-800">{sp.name}</span>
                {sp.schedule && <span className="text-slate-400">· {sp.schedule}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trending searches */}
      <div className="rounded-2xl border bg-white p-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-indigo-600" />
          Más buscado
        </h3>
        <div className="mt-2 space-y-1 text-xs">
          {trendingSearches.map((term, i) => (
            <button
              key={term}
              type="button"
              onClick={() => onSearch(term)}
              className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-left hover:bg-indigo-50 transition"
            >
              <span className="line-clamp-1">{i + 1}. {term}</span>
              <span className="text-[11px] text-slate-400">Ver</span>
            </button>
          ))}
        </div>
      </div>

      {/* Safety tips */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs text-sky-900">
        <p className="font-semibold flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          Consejos de compra segura
        </p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
          <li>Revisa el producto antes de pagar.</li>
          <li>Coordina en puntos seguros del campus.</li>
          <li>No compartas datos personales sensibles.</li>
          <li>Reporta cualquier sospecha.</li>
        </ul>
      </div>
    </aside>
  );
}
