import { useEffect, useState } from "react";
import type { StoreCategory } from "@/lib/api-helpers";
import { getStoreCategories } from "@/lib/api-helpers";

export function StoreFilters({
  categorySlug,
  setCategorySlug,
  type,
  setType,
  deliveryType,
  setDeliveryType,
  sort,
  setSort,
}: {
  categorySlug: string;
  setCategorySlug: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  deliveryType: string;
  setDeliveryType: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
}) {
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  useEffect(() => {
    getStoreCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
      <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Categoría">
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.slug} value={cat.slug}>{cat.name}</option>
        ))}
      </select>

      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Tipo">
        <option value="">Todos los tipos</option>
        <option value="SALE">Venta</option>
        <option value="SERVICE">Servicio</option>
        <option value="EXCHANGE">Intercambio</option>
        <option value="DONATION">Donación</option>
        <option value="RENTAL">Alquiler</option>
        <option value="REQUEST">Solicitud</option>
      </select>

      <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Entrega">
        <option value="">Todas las entregas</option>
        <option value="CAMPUS">En campus</option>
        <option value="SAFE_POINT">Punto seguro</option>
        <option value="PICKUP">Recojo</option>
        <option value="COORDINATED">Coordinado</option>
        <option value="SHIPPING">Envío</option>
        <option value="DIGITAL">Digital</option>
      </select>

      <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Orden">
        <option value="recent">Más recientes</option>
        <option value="low_price">Menor precio</option>
        <option value="high_price">Mayor precio</option>
        <option value="most_viewed">Más vistos</option>
        <option value="most_saved">Más guardados</option>
        <option value="campus">En campus</option>
      </select>
    </div>
  );
}
