import Link from "next/link";
import { Eye, Heart, MessageCircle, ShieldAlert, Star } from "lucide-react";
import { StoreListingFallbackMedia } from "./StoreListingFallbackMedia";
import type { StoreListing } from "./types";

export function StoreListingCard({ item, onSave, onContact, onShare, onReport, onHide }: { item: StoreListing; onSave: (id: string) => void; onContact: (t: string) => void; onShare: (id: string) => void; onReport: () => void; onHide: (id: string) => void }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <div className="h-[132px]">
          <StoreListingFallbackMedia category={item.category} compact />
        </div>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 text-[10px]">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5">{item.status === "available" ? "Disponible" : item.status}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.deliveryType === "off_campus" ? "Fuera" : "Campus"}</span>
          {item.seller.verified ? <span className="rounded-full bg-indigo-100 px-2 py-0.5">Verificado</span> : null}
        </div>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{item.title}</h3>
        <p className="mt-1 text-lg font-black text-indigo-700">{item.priceLabel ?? (item.price ? `S/ ${item.price}` : "A tratar")}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">{item.course ?? "General"} · {item.location ?? "Campus"}</p>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span className="line-clamp-1">{item.seller.name}</span>
          {item.seller.rating ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
              {item.seller.rating}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{item.stats.views}</span>
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{item.stats.saves}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{item.stats.contacts}</span>
        </div>

        {item.deliveryType === "off_campus" ? <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700"><ShieldAlert className="h-3.5 w-3.5" />Coordina con precaución</p> : null}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <Link href={`/app/tienda/${item.id}`} className="rounded-md bg-indigo-600 px-2.5 py-1.5 font-medium text-white">Ver</Link>
          <button type="button" onClick={() => onSave(item.id)} className="rounded-md border px-2 py-1.5">Guardar</button>
          <button type="button" onClick={() => onContact(item.title)} className="rounded-md border px-2 py-1.5">Contactar</button>
          <button type="button" onClick={() => onShare(item.id)} className="rounded-md border px-2 py-1.5">Compartir</button>
          <button type="button" onClick={onReport} className="rounded-md border px-2 py-1.5">Reportar</button>
          <button type="button" onClick={() => onHide(item.id)} className="rounded-md border px-2 py-1.5">Ocultar</button>
        </div>
      </div>
    </article>
  );
}
