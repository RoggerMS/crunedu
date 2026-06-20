"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, MapPin, ShieldAlert, Flag, Share2, MoreHorizontal, BadgeCheck, Edit3, PauseCircle, CheckCircle2 } from "lucide-react";
import { StoreListingFallbackMedia } from "@/components/store/StoreListingFallbackMedia";
import { StoreReportModal } from "@/components/store/StoreReportModal";
import { StoreSection } from "@/components/store/StoreSection";
import type { StoreImage, StoreProduct } from "@/lib/api-helpers";
import {
  getStoreProductDetail,
  favoriteStoreProduct,
  reportStoreProduct,
  createStoreInquiry,
  publishStoreProduct,
  pauseStoreProduct,
  markProductSold,
  deleteStoreProduct,
} from "@/lib/api-helpers";
import { useAuth } from "@/providers/auth-provider";
import { QUICK_MESSAGES } from "@/components/store/store-data";

const TOKEN_KEY = "crunedu_access_token";

function getToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
}

export default function TiendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, accessToken } = useAuth();
  const token = accessToken || getToken();

  const [item, setItem] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const popToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStoreProductDetail(Number(id));
        if (!cancelled) {
          setItem(data);
          setSaved(data.viewerState?.saved ?? false);
        }
      } catch {
        if (!cancelled) setError("Producto no encontrado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function toggleSave() {
    if (!token) return popToast("Inicia sesión.");
    try {
      await favoriteStoreProduct(id, token);
      setSaved(!saved);
      popToast(saved ? "Quitado de guardados." : "Guardado.");
    } catch { popToast("Error."); }
  }

  function shareProduct() {
    navigator.clipboard.writeText(window.location.href);
    popToast("Enlace copiado.");
  }

  async function sendInquiry() {
    if (!token) return popToast("Inicia sesión para contactar.");
    if (!inquiryMsg.trim()) return popToast("Escribe un mensaje.");
    setSending(true);
    try {
      await createStoreInquiry(id, { message: inquiryMsg.trim(), preferredContactMethod: "chat" }, token);
      popToast("Consulta enviada.");
      setInquiryMsg("");
    } catch { popToast("Error al enviar."); }
    finally { setSending(false); }
  }

  function setQuickMessage(msg: string) {
    setInquiryMsg(msg);
  }

  async function handleReport(pid: string, reason: string, description?: string) {
    if (!token) return popToast("Inicia sesión.");
    try {
      await reportStoreProduct(pid, { reason, description }, token);
      popToast("Reporte enviado.");
    } catch { popToast("Error."); }
  }

  async function ownerAction(action: "publish" | "pause" | "sold" | "delete") {
    if (!token) return;
    try {
      if (action === "publish") await publishStoreProduct(id, token);
      else if (action === "pause") await pauseStoreProduct(id, token);
      else if (action === "sold") await markProductSold(id, token);
      else if (action === "delete") { await deleteStoreProduct(id, token); window.location.href = "/app/tienda"; return; }
      const updated = await getStoreProductDetail(Number(id));
      setItem(updated);
      popToast("Actualizado.");
    } catch { popToast("Error."); }
  }

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-8"><Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link><p className="mt-4 text-sm text-slate-500">Cargando...</p></div>;
  if (error || !item) return <div className="mx-auto max-w-5xl px-6 py-8"><Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link><p className="mt-4 text-sm text-slate-600">{error ?? "No disponible."}</p></div>;

  const isMine = item.viewerState?.isMine;
  const canEdit = item.viewerState?.canEdit;

  const priceDisplay = item.priceType === "free"
    ? "Gratis"
    : item.priceType === "exchange"
    ? "Intercambio"
    : item.priceType === "contact"
    ? "Consultar precio"
    : item.price != null
    ? `S/ ${item.price}`
    : "Consultar";

  return (
    <div className="mx-auto min-w-0 max-w-[1500px] space-y-4 overflow-hidden px-4 py-4 sm:px-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link>
        <span className="text-xs text-slate-500"> / {item.category?.name}</span>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(240px,280px)]">
        {/* Image gallery */}
        <div className="overflow-hidden rounded-2xl border bg-white">
          {item.images && item.images.length > 0 ? (
            <div>
              <div className="h-[260px] max-w-full cursor-pointer bg-slate-100 sm:h-[340px] xl:h-[380px]" onClick={() => {
                const cover = item.images.find((i: StoreImage) => i.isCover) ?? item.images[0];
                if (cover) setLightboxImg(cover.imageUrl);
              }}>
                {(() => {
                  const cover = item.images.find((i: StoreImage) => i.isCover) ?? item.images[0];
                  return <img src={cover!.imageUrl} alt={cover!.altText ?? item.title} className="h-full w-full max-w-full object-contain" />;
                })()}
              </div>
              {item.images.length > 1 && (
                <div className="flex max-w-full gap-2 overflow-x-auto border-t p-2">
                  {item.images.map((img: StoreImage) => (
                    <button key={img.id} onClick={() => setLightboxImg(img.imageUrl)} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 hover:border-indigo-400">
                      <img src={img.imageUrl} alt={img.altText ?? ""} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[260px] sm:h-[340px] xl:h-[380px]">
              <StoreListingFallbackMedia categorySlug={item.category?.slug} iconKey={item.category?.icon} />
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="min-w-0 space-y-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="break-words text-xl font-black text-slate-900 [overflow-wrap:anywhere] lg:text-2xl">{item.title}</h1>
          <p className="max-w-full truncate text-2xl font-black text-indigo-700 lg:text-3xl">{priceDisplay}</p>
          {item.isNegotiable && priceDisplay !== "Gratis" && priceDisplay !== "Intercambio" && (
            <p className="text-sm text-slate-500">Precio negociable</p>
          )}

          <div className="flex min-w-0 flex-wrap gap-1.5 text-xs">
            <span className={`max-w-full rounded-full px-2 py-0.5 ${
              item.status === "active" || item.status === "available" ? "bg-emerald-100 text-emerald-700" :
              item.status === "draft" ? "bg-slate-100 text-slate-600" :
              "bg-amber-100 text-amber-700"
            }`}>{item.status === "active" || item.status === "available" ? "Disponible" : item.status}</span>
            {item.type && <span className="max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5">{item.type === "sale" ? "Venta" : item.type === "service" ? "Servicio" : item.type === "exchange" ? "Intercambio" : item.type === "donation" ? "Donación" : item.type}</span>}
            {item.condition && item.condition !== "not_applicable" && <span className="max-w-full truncate rounded-full bg-sky-100 px-2 py-0.5 capitalize">{item.condition === "new" ? "Nuevo" : item.condition === "like_new" ? "Como nuevo" : item.condition === "good" ? "Buen estado" : "Usado"}</span>}
            {item.seller.verified && <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-indigo-100 px-2 py-0.5"><BadgeCheck className="h-3 w-3" />Verificado</span>}
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold">Vendedor</p>
            <p className="mt-0.5 break-words [overflow-wrap:anywhere]">{item.seller.name}</p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Entrega</p>
            <p className="mt-0.5 break-words [overflow-wrap:anywhere]">{item.campus ?? item.safePoint?.name ?? "Coordinado"}</p>
            {item.deliveryType === "shipping" && <p className="mt-1 text-amber-700 flex items-center gap-1"><ShieldAlert className="h-4 w-4" />Coordinar en lugar público.</p>}
          </div>

          {item.course && (
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold">Curso relacionado</p>
              <p className="mt-0.5 break-words [overflow-wrap:anywhere]">{item.course}</p>
            </div>
          )}

          {item.brand && (
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold">Marca / Modelo</p>
              <p className="mt-0.5 break-words [overflow-wrap:anywhere]">{item.brand}{item.model ? ` · ${item.model}` : ""}</p>
            </div>
          )}

          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{item.stats.views} vistas</span>
            <span>{item.stats.saves} guardados</span>
            <span>{item.stats.contacts} contactos</span>
          </div>

          {/* Action buttons */}
          <div className="flex min-w-0 flex-wrap gap-2">
            {isAuthenticated && !isMine && (
              <button type="button" onClick={toggleSave} className={`flex max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${saved ? "bg-rose-50 text-rose-700 border-rose-200" : ""}`}>
                <Heart className={`h-3.5 w-3.5 ${saved ? "fill-rose-600 text-rose-600" : ""}`} />{saved ? "Guardado" : "Guardar"}
              </button>
            )}
            {!isMine && (
              <button type="button" onClick={shareProduct} className="flex max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold">
                <Share2 className="h-3.5 w-3.5" />Compartir
              </button>
            )}
            {isAuthenticated && !isMine && (
              <button type="button" onClick={() => setShowReport(true)} className="flex max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-rose-600">
                <Flag className="h-3.5 w-3.5" />Reportar
              </button>
            )}

            {/* Owner actions */}
            {canEdit && (
              <div className="relative">
                <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="flex max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold">
                  <MoreHorizontal className="h-3.5 w-3.5" />Gestionar
                </button>
                {menuOpen && (
                  <div className="absolute bottom-full mb-1 w-44 rounded-lg border bg-white py-1 shadow-lg text-xs z-20">
                    <Link href={`/app/tienda/nuevo?edit=${item.id}`} className="block w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"><Edit3 className="h-3 w-3" />Editar</Link>
                    {item.status === "draft" && <button onClick={() => ownerAction("publish")} className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" />Publicar</button>}
                    {item.status === "active" && <button onClick={() => ownerAction("pause")} className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-1.5"><PauseCircle className="h-3 w-3" />Pausar</button>}
                    {item.status === "active" && <button onClick={() => ownerAction("sold")} className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-indigo-700">Marcar vendido</button>}
                    <button onClick={() => ownerAction("delete")} className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-rose-600">Eliminar</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="min-w-0 space-y-3">
          {/* Contact section */}
          {isAuthenticated && !isMine && (
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-bold">Contactar al vendedor</h3>
              <div className="mt-2 space-y-1.5">
                {QUICK_MESSAGES.filter((qm) => qm.type !== "CUSTOM").map((qm) => (
                  <button
                    key={qm.type}
                    type="button"
                    onClick={() => setQuickMessage(qm.template)}
                    className="w-full min-w-0 break-words rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs transition hover:bg-indigo-50 [overflow-wrap:anywhere]"
                  >
                    {qm.label}
                  </button>
                ))}
              </div>
              <textarea
                value={inquiryMsg}
                onChange={(e) => setInquiryMsg(e.target.value)}
                placeholder="Escribe tu consulta..."
                rows={3}
                className="mt-2 w-full min-w-0 resize-y rounded-lg border border-slate-200 px-2.5 py-2 text-sm [overflow-wrap:anywhere]"
              />
              <button
                onClick={sendInquiry}
                disabled={sending || !inquiryMsg.trim()}
                className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Enviar consulta"}
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="rounded-2xl border bg-white p-3 text-center text-xs text-slate-600">
              <p>Inicia sesión para contactar al vendedor.</p>
              <Link href="/login" className="mt-2 inline-block rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Iniciar sesión</Link>
            </div>
          )}

          {isMine && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">
              <p className="font-semibold">Es tu producto</p>
              <p className="mt-1">Puedes editar, pausar o marcar como vendido desde el botón Gestionar.</p>
            </div>
          )}

          {/* Safety */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-xs">
            <p className="font-semibold text-sky-900">Compra segura</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sky-900">
              <li>Revisa el producto antes de pagar.</li>
              <li>Coordina en puntos seguros del campus.</li>
              <li>No compartas datos sensibles.</li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-3 text-xs text-slate-700">
            <p className="font-semibold">Información del vendedor</p>
            <p className="mt-1">Publicado el {new Date(item.createdAt).toLocaleDateString("es-PE")}</p>
            {item.publishedAt && <p className="mt-0.5">Activo desde {new Date(item.publishedAt).toLocaleDateString("es-PE")}</p>}
          </div>
        </aside>
      </div>

      {/* Description */}
      <StoreSection title="Descripción" subtitle="Información del producto.">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{item.description}</p>
        </div>
      </StoreSection>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Vista ampliada" className="max-h-full max-w-full object-contain" />
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <StoreReportModal productId={id} onReport={handleReport} onClose={() => setShowReport(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded bg-slate-900 px-3 py-2 text-sm text-white">{toast}</div>
      )}
    </div>
  );
}
