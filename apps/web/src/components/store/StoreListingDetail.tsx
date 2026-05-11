import Link from "next/link";
import { Heart, MapPin, ShieldAlert, Star } from "lucide-react";
import type { StoreListing } from "./types";
import { StoreListingFallbackMedia } from "./StoreListingFallbackMedia";

export function StoreListingDetail({ item, onContact, onReserve, onSave, onShare, onReport }: { item: StoreListing; onContact: () => void; onReserve: () => void; onSave: () => void; onShare: () => void; onReport: () => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link>
        <p className="text-sm text-slate-500">Tienda universitaria / {item.category} / {item.course ?? "General"}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)_320px]">
        <div className="rounded-3xl border bg-white p-4"><StoreListingFallbackMedia category={item.category} /></div>
        <div className="space-y-4 rounded-3xl border bg-white p-5">
          <h1 className="text-3xl font-black text-slate-900">{item.title}</h1>
          <p className="text-3xl font-bold text-indigo-700">{item.priceLabel ?? (item.price ? `S/ ${item.price}` : "A tratar")}</p>
          <p className="text-sm text-slate-600">{item.description}</p>
          <div className="rounded-2xl border bg-slate-50 p-3 text-sm"><p className="font-semibold">Vendedor</p><p>{item.seller.name} · {item.seller.sales ?? 0} ventas · <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{item.seller.rating ?? 0}</span></p></div>
          <div className="rounded-2xl border bg-slate-50 p-3 text-sm"><p className="font-semibold">Entrega</p><p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location ?? "Campus"} · {item.deliveryType}</p>{item.deliveryType === "off_campus" ? <p className="mt-2 flex items-center gap-1 text-amber-700"><ShieldAlert className="h-4 w-4" />Coordinar en lugar público.</p> : null}</div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={onContact} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white">Contactar vendedor</button><button type="button" onClick={onReserve} className="rounded-xl border px-3 py-2 text-sm">Reservar producto</button><button type="button" onClick={onSave} className="rounded-xl border px-3 py-2 text-sm">Guardar</button><button type="button" onClick={onShare} className="rounded-xl border px-3 py-2 text-sm">Compartir</button><button type="button" onClick={onReport} className="rounded-xl border px-3 py-2 text-sm text-rose-700">Reportar</button></div>
        </div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm"><p className="font-semibold">Consejos de compra segura</p><ul className="mt-2 list-disc space-y-1 pl-4"><li>Revisa antes de pagar.</li><li>Coordina en zonas públicas.</li><li>Usa el chat interno.</li></ul></div>
          <div className="rounded-2xl border bg-white p-4 text-sm"><p className="font-semibold">Puntos seguros</p><p className="mt-2">Biblioteca Central, Patio Principal, Cafetería Central.</p></div>
          <button type="button" onClick={onSave} className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><Heart className="h-4 w-4" />Agregar a guardados</button>
        </aside>
      </div>
    </div>
  );
}
