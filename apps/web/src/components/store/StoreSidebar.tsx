import { ShieldAlert, Star } from "lucide-react";

const trustedSellers = [
  { name: "CopyUNI", rating: "4.9", sales: "128" },
  { name: "Sabor Campus", rating: "4.8", sales: "96" },
  { name: "Profe Nico", rating: "4.9", sales: "81" },
  { name: "María Fernanda", rating: "4.7", sales: "73" },
];

const trendingSearches = ["Calculadora científica", "Separatas", "Mandil", "Libro de Cálculo", "Impresiones"];

export function StoreSidebar({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <aside className="space-y-3">
      <div className="rounded-2xl border bg-white p-3">
        <h3 className="text-sm font-semibold">Puntos seguros de entrega</h3>
        <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
          <li>Biblioteca Central</li>
          <li>Patio Principal</li>
          <li>Entrada Principal</li>
          <li>Cafetería Central</li>
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-3">
        <h3 className="text-sm font-semibold">Más buscado</h3>
        <div className="mt-2 space-y-1.5 text-xs">
          {trendingSearches.map((term, index) => (
            <button key={term} type="button" onClick={() => onSearch(term)} className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-left hover:bg-indigo-50">
              <span className="line-clamp-1">{index + 1}. {term}</span>
              <span className="text-[11px] text-slate-500">Ver</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3">
        <h3 className="text-sm font-semibold">Vendedores confiables</h3>
        <div className="mt-2 space-y-1.5">
          {trustedSellers.map((seller) => (
            <div key={seller.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">{seller.name.charAt(0)}</span>
                <span>{seller.name}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-amber-600"><Star className="h-3 w-3 fill-amber-500" />{seller.rating} · {seller.sales}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs text-sky-900">
        <p className="font-semibold">Consejos de compra segura</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
          <li>Revisa el producto antes de pagar.</li>
          <li>Coordina en zonas públicas.</li>
          <li>No compartas datos sensibles.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4" />Fuera de campus: evita pagos adelantados y coordina en puntos públicos.</p>
      </div>
    </aside>
  );
}
