import Link from "next/link";
import { MoreHorizontal, Heart, MapPin, BadgeCheck } from "lucide-react";
import { StoreListingFallbackMedia } from "./StoreListingFallbackMedia";
import type { StoreProduct } from "@/lib/api-helpers";
import { useState, useRef, useEffect } from "react";

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} d`;
  return new Date(dateStr).toLocaleDateString("es-PE");
}

export function StoreListingCard({
  item,
  onSave,
  onShare,
  onReport,
  onHide,
  viewerRole,
}: {
  item: StoreProduct;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  onHide: (id: string) => void;
  viewerRole?: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickAway(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", clickAway);
    return () => document.removeEventListener("mousedown", clickAway);
  }, []);

  const isMine = item.viewerState?.isMine;
  const coverImage = item.images?.find((img) => img.isCover) ?? item.images?.[0];
  const hasRealImage = coverImage?.imageUrl && !coverImage.imageUrl.includes("placeholder");

  const priceDisplay = item.priceType === "free"
    ? "Gratis"
    : item.priceType === "exchange"
    ? "Intercambio"
    : item.priceType === "contact"
    ? "Consultar"
    : item.price != null
    ? `S/ ${item.price}`
    : "Consultar";

  const statusBadge = item.status === "active" || item.status === "available"
    ? null
    : item.status === "draft"
    ? "Borrador"
    : item.status === "sold_out" || item.status === "sold"
    ? "Vendido"
    : item.status === "hidden" || item.status === "paused"
    ? "Pausado"
    : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/app/tienda/${item.id}`} className="block" aria-label={`Ver ${item.title}`}>
        <div className="relative">
          {hasRealImage ? (
            <div className="h-[140px] overflow-hidden bg-slate-100">
              <img
                src={coverImage!.imageUrl}
                alt={coverImage!.altText ?? item.title}
                className="h-full w-full max-w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-[140px] overflow-hidden">
              <StoreListingFallbackMedia categorySlug={item.category?.slug} iconKey={item.category?.icon} compact />
            </div>
          )}

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-3rem)] flex-wrap gap-1 text-[10px]">
            {statusBadge && (
              <span className="truncate rounded-full bg-amber-100 px-2 py-0.5 font-medium">{statusBadge}</span>
            )}
            {item.condition && item.condition !== "not_applicable" && (
              <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 capitalize">{item.condition === "new" ? "Nuevo" : item.condition === "like_new" ? "Como nuevo" : item.condition === "good" ? "Buen estado" : "Usado"}</span>
            )}
            {item.deliveryType === "campus" && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5">En campus</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(item.id); }}
            className={`absolute right-2 top-2 z-10 rounded-full p-1.5 transition ${
              item.viewerState?.saved ? "bg-rose-100 text-rose-600" : "bg-white/80 text-slate-400 hover:text-rose-500"
            }`}
            aria-label={item.viewerState?.saved ? "Quitar de guardados" : "Guardar"}
          >
            <Heart className={`h-4 w-4 ${item.viewerState?.saved ? "fill-rose-600" : ""}`} />
          </button>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <Link href={`/app/tienda/${item.id}`} className="block min-w-0">
          <h3 className="line-clamp-2 break-words [overflow-wrap:anywhere] text-sm font-bold text-slate-900">{item.title}</h3>
        </Link>
        <p className="mt-1 max-w-full truncate text-base font-black text-indigo-700">{priceDisplay}</p>
        {item.isNegotiable && priceDisplay !== "Gratis" && priceDisplay !== "Intercambio" && (
          <span className="max-w-full truncate text-[11px] text-slate-500">Precio negociable</span>
        )}
        <p className="mt-0.5 flex min-w-0 items-center gap-0.5 truncate text-xs text-slate-600">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{item.campus ?? item.location ?? item.safePoint?.name ?? "Campus"}</span>
        </p>

        <div className="mt-2 flex min-w-0 items-center justify-between gap-2 text-xs text-slate-600">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <span className="truncate [overflow-wrap:anywhere]">{item.seller.name}</span>
            {item.seller.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-indigo-500" />}
          </span>
          <span className="shrink-0 text-[11px] text-slate-500">{relativeTime(item.createdAt)}</span>
        </div>

        <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-1">
          <Link
            href={`/app/tienda/${item.id}`}
            className="max-w-full truncate rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Ver
          </Link>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-md border bg-white p-1 text-slate-500 hover:bg-slate-50"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full right-0 z-30 mb-1 w-36 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-white py-1 text-xs shadow-lg">
                <button type="button" onClick={() => { onShare(item.id); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left hover:bg-slate-50">Compartir</button>
                {viewerRole !== null && (
                  <button type="button" onClick={() => { onReport(item.id); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50">Reportar</button>
                )}
                {!isMine && (
                  <button type="button" onClick={() => { onHide(item.id); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-left hover:bg-slate-50">Ocultar</button>
                )}
                {isMine && (
                  <Link href={`/app/tienda/${item.id}`} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50">Editar</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
