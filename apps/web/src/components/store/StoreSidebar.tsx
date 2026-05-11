import { ShieldAlert, Star } from "lucide-react";

const trustedSellers = ["CopyUNI", "Sabor Campus", "Profe Nico", "María Fernanda"];
const trendingSearches = ["Calculadora científica", "Separatas", "Mandil de laboratorio", "Libro de Cálculo", "Impresiones"];

export function StoreSidebar({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold">Puntos seguros de entrega</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>Biblioteca Central</li><li>Patio Principal</li><li>Entrada Principal</li><li>Cafetería Central</li><li>Facultad de Ciencias</li>
        </ul>
        <button type="button" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm">Ver puntos</button>
      </div>
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold">Más buscado esta semana</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {trendingSearches.map((term) => (
            <button key={term} type="button" onClick={() => onSearch(term)} className="rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-indigo-100">{term}</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-4">
        <h3 className="font-semibold">Vendedores confiables</h3>
        <div className="mt-3 space-y-2 text-sm">
          {trustedSellers.map((seller) => (
            <div key={seller} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>{seller}</span>
              <span className="flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-500" />4.8</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-semibold">Consejos de compra segura</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Revisa el producto antes de pagar.</li><li>Coordina en zonas públicas.</li><li>Usa el chat interno.</li><li>No compartas datos sensibles.</li><li>Reporta problemas.</li>
        </ul>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4" />Las entregas fuera de campus pueden tener mayor riesgo. Coordina en lugares públicos y evita pagos adelantados.</p>
      </div>
    </aside>
  );
}
