import Link from "next/link";
import { Eye, Heart, MessageCircle, MoreHorizontal, ShieldAlert, Star } from "lucide-react";
import { StoreListingFallbackMedia } from "./StoreListingFallbackMedia";
import type { StoreListing } from "./types";

export function StoreListingCard({ item, onSave, onContact, onShare, onReport, onHide }: { item: StoreListing; onSave: (id: string) => void; onContact: (t: string) => void; onShare: (id: string) => void; onReport: () => void; onHide: (id: string) => void }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="relative">
        <StoreListingFallbackMedia category={item.category} />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 text-[11px]">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5">{item.status === "available" ? "Disponible" : item.status}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.deliveryType === "off_campus" ? "Fuera de campus" : "En campus"}</span>
          {item.seller.verified ? <span className="rounded-full bg-indigo-100 px-2 py-0.5">Verificado</span> : null}
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-1 text-xl font-bold text-indigo-700">{item.priceLabel ?? (item.price ? `S/ ${item.price}` : "A tratar")}</p>
      <p className="mt-1 text-xs text-slate-600">{item.course ?? "General"} · {item.location ?? "Campus"}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        <span>{item.seller.name} {item.seller.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-500" />{item.seller.rating}</span> : null}</span>
        <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" />{item.stats.views}<Heart className="h-3.5 w-3.5" />{item.stats.saves}<MessageCircle className="h-3.5 w-3.5" />{item.stats.contacts}</span>
      </div>
      {item.deliveryType === "off_campus" ? <p className="mt-2 flex items-center gap-1 text-xs text-amber-700"><ShieldAlert className="h-3.5 w-3.5" />Coordinar con precaución</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Link href={`/app/tienda/${item.id}`} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-white">Ver producto</Link>
        <button type="button" onClick={() => onSave(item.id)} className="rounded-lg border px-2.5 py-1.5">Guardar</button>
        <button type="button" onClick={() => onContact(item.title)} className="rounded-lg border px-2.5 py-1.5">Contactar</button>
        <button type="button" onClick={() => onShare(item.id)} className="rounded-lg border px-2.5 py-1.5">Compartir</button>
        <button type="button" onClick={onReport} className="rounded-lg border px-2.5 py-1.5">Reportar</button>
        <button type="button" onClick={() => onHide(item.id)} className="rounded-lg border px-2.5 py-1.5"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
