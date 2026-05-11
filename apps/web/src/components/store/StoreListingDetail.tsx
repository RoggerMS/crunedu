import Link from "next/link";
import { Heart, MapPin, ShieldAlert, Star } from "lucide-react";
import { StoreListingFallbackMedia } from "./StoreListingFallbackMedia";
import type { StoreListing } from "./types";

export function StoreListingDetail({ item, onContact, onReserve, onSave, onShare, onReport }: { item: StoreListing; onContact: () => void; onReserve: () => void; onSave: () => void; onShare: () => void; onReport: () => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link>
        <p className="text-xs text-slate-500">Tienda universitaria / {item.category} / {item.course ?? "General"}</p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="h-[420px]">
            <StoreListingFallbackMedia category={item.category} />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4">
          <h1 className="text-2xl font-black text-slate-900">{item.title}</h1>
          <p className="text-3xl font-black text-indigo-700">{item.priceLabel ?? (item.price ? `S/ ${item.price}` : "A tratar")}</p>
          <p className="text-sm text-slate-600">{item.description}</p>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5">{item.status === "available" ? "Disponible" : item.status}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.deliveryType === "off_campus" ? "Fuera de campus" : "En campus"}</span>
            {item.seller.verified ? <span className="rounded-full bg-indigo-100 px-2 py-0.5">Comunidad verificada</span> : null}
          </div>

          <div className="rounded-xl border bg-slate-50 p-3 text-sm">
            <p className="font-semibold">Vendedor</p>
            <p className="mt-0.5">{item.seller.name} · {item.seller.sales ?? 0} ventas · <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />{item.seller.rating ?? 0}</span></p>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3 text-sm">
            <p className="font-semibold">Entrega</p>
            <p className="mt-0.5 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location ?? "Campus"} · {item.deliveryType}</p>
            {item.deliveryType === "off_campus" ? <p className="mt-1.5 flex items-center gap-1 text-amber-700"><ShieldAlert className="h-4 w-4" />Coordinar en lugar público.</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onContact} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Contactar</button>
            <button type="button" onClick={onReserve} className="rounded-lg border px-3 py-2 text-xs font-semibold">Reservar</button>
            <button type="button" onClick={onSave} className="rounded-lg border px-3 py-2 text-xs font-semibold">Guardar</button>
            <button type="button" onClick={onShare} className="rounded-lg border px-3 py-2 text-xs font-semibold">Compartir</button>
            <button type="button" onClick={onReport} className="rounded-lg border px-3 py-2 text-xs font-semibold text-rose-700">Reportar</button>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs">
            <p className="font-semibold text-sky-900">Compra segura</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sky-900">
              <li>Revisa antes de pagar.</li>
              <li>Coordina en zonas públicas.</li>
              <li>Usa el chat interno.</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-3 text-xs text-slate-700">
            <p className="font-semibold">Puntos seguros</p>
            <p className="mt-1">Biblioteca Central, Patio Principal, Cafetería Central.</p>
          </div>
          <button type="button" onClick={onSave} className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold"><Heart className="h-4 w-4" />Agregar a guardados</button>
        </aside>
      </div>
    </div>
  );
}
