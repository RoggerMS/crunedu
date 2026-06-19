"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LoginRequiredNotice } from "@/components/auth/login-required-notice";
import { useAccessToken } from "@/hooks/useAccessToken";
import { PageState, PrimaryButton } from "@/components/ui";
import {
  createAdminProduct,
  getAdminStoreInquiries,
  getAdminStoreMetrics,
  getAdminStoreProducts,
  getAdminStoreReports,
  getStoreCategories,
  updateAdminStoreInquiryStatus,
  updateAdminProductStatus,
} from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

function parseRole(token: string | null) {
  try {
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ?? null;
  } catch { return null; }
}

const INQUIRY_STATES = ["PENDING", "CONTACTED", "RESOLVED", "CANCELLED"] as const;
const PRODUCT_STATES = ["DRAFT", "ACTIVE", "HIDDEN", "SOLD_OUT", "DELETED"] as const;

type ProductForm = {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  type: string;
  priceType: string;
  isFeatured: boolean;
  status: string;
};

export default function AdminTiendaPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const role = useMemo(() => parseRole(accessToken), [accessToken]);
  const isAdmin = role === "ADMIN";

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [form, setForm] = useState<ProductForm>({ title: "", description: "", price: "", categoryId: "", type: "SALE", priceType: "FIXED", isFeatured: false, status: "ACTIVE" });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  async function loadAdminData() {
    if (!accessToken) return;
    setLoading(true);
    setLoadingError(null);
    try {
      const [cats, prods, inqs, reps, mets] = await Promise.all([
        getStoreCategories(),
        getAdminStoreProducts(accessToken),
        getAdminStoreInquiries(accessToken),
        getAdminStoreReports(accessToken),
        getAdminStoreMetrics(accessToken),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setInquiries(Array.isArray(inqs?.items) ? inqs.items : []);
      setReports(Array.isArray(reps?.items) ? reps.items : []);
      setMetrics(mets ?? null);
    } catch (err) {
      setLoadingError(mapApiError(err, "No se pudo cargar el panel."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdminData(); }, [accessToken]);

  function validate() {
    if (form.title.trim().length < 3) return "El título debe tener al menos 3 caracteres.";
    if (form.description.trim().length < 10) return "La descripción debe tener al menos 10 caracteres.";
    if (!form.categoryId) return "Selecciona una categoría.";
    if (Number(form.price) < 0) return "El precio no puede ser negativo.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setStatus(null);
    const err = validate(); if (err) { setStatus(err); return; }
    try {
      setSaving(true);
      await createAdminProduct({ title: form.title.trim(), description: form.description.trim(), price: Number(form.price), categoryId: Number(form.categoryId), type: form.type, priceType: form.priceType, status: form.status, isFeatured: form.isFeatured, stock: 1 }, accessToken ?? "");
      setStatus("Producto guardado.");
      setForm({ title: "", description: "", price: "", categoryId: "", type: "SALE", priceType: "FIXED", isFeatured: false, status: "ACTIVE" });
      await loadAdminData();
    } catch (err) { setStatus(mapApiError(err)); }
    finally { setSaving(false); }
  }

  async function onUpdateInquiry(inquiryId: number, nextStatus: string) {
    if (!accessToken) return;
    try { await updateAdminStoreInquiryStatus(inquiryId, nextStatus, accessToken); setStatus("Estado actualizado."); await loadAdminData(); }
    catch (err) { setStatus(mapApiError(err)); }
  }

  async function onUpdateProductStatus(productId: number, nextStatus: string) {
    if (!accessToken) return;
    try { await updateAdminProductStatus(productId, nextStatus, accessToken); setStatus("Estado actualizado."); await loadAdminData(); }
    catch (err) { setStatus(mapApiError(err)); }
  }

  if (!isAuthenticated) return <LoginRequiredNotice title="Inicia sesión para gestionar productos." description="Necesitas una sesión activa." returnUrl="/app/admin/tienda" />;
  if (!isAdmin) return <PageState type="error" title="Acceso restringido" description="Solo administradores pueden acceder a este panel." />;
  if (loading) return <PageState type="loading" title="Cargando admin tienda" description="Cargando productos, consultas y métricas." />;
  if (loadingError) return <PageState type="error" title="No se pudo cargar el panel" description={loadingError} action={<PrimaryButton type="button" onClick={loadAdminData}>Reintentar</PrimaryButton>} />;

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">Admin tienda</h1>
        <p className="mt-1 text-sm text-slate-600">Gestión de productos, consultas y métricas del marketplace.</p>
        {metrics?.totals && (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Vistas: <strong>{metrics.totals.views}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Contactos: <strong>{metrics.totals.contactClicks}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Guardados: <strong>{metrics.totals.saves}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Consultas: <strong>{metrics.inquirySummary?.total ?? 0}</strong></p>
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Crear producto</h2>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <input className="rounded-xl border px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required minLength={3} maxLength={200} />
          <textarea className="rounded-xl border px-3 py-2" placeholder="Descripción" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} minLength={10} maxLength={3000} />
          <input type="number" min="0" step="0.01" className="rounded-xl border px-3 py-2" placeholder="Precio" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
          <select className="rounded-xl border px-3 py-2" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
            <option value="">Categoría</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="rounded-xl border px-3 py-2" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="SALE">Venta</option><option value="SERVICE">Servicio</option><option value="EXCHANGE">Intercambio</option><option value="DONATION">Donación</option><option value="RENTAL">Alquiler</option><option value="REQUEST">Solicitud</option>
          </select>
          <select className="rounded-xl border px-3 py-2" value={form.priceType} onChange={(e) => setForm((p) => ({ ...p, priceType: e.target.value }))}>
            <option value="FIXED">Fijo</option><option value="NEGOTIABLE">Negociable</option><option value="FREE">Gratis</option><option value="CONTACT">Consultar</option><option value="EXCHANGE">Intercambio</option><option value="HOURLY">Por hora</option><option value="FROM">Desde</option>
          </select>
          <select className="rounded-xl border px-3 py-2" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="ACTIVE">Activo</option><option value="DRAFT">Borrador</option><option value="HIDDEN">Oculto</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} /> Destacado</label>
          <button disabled={saving} className="w-fit rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Crear producto"}</button>
        </form>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Productos ({products.length})</h2>
        <div className="mt-3 space-y-2">
          {products.length === 0 ? <p className="text-sm text-slate-500">No hay productos.</p> : products.map((p) => (
            <div key={p.id} className="rounded-xl border p-3 text-sm space-y-1">
              <p className="font-semibold">{p.title}{p.isFeatured ? " · Destacado" : ""}</p>
              <p className="text-slate-600">{p.category?.name} · {p.status} · {p.type ?? "SALE"}</p>
              <select value={p.status} onChange={(e) => onUpdateProductStatus(p.id, e.target.value)} className="rounded-lg border px-2 py-1 text-xs">
                {PRODUCT_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Consultas ({inquiries.length})</h2>
        <div className="mt-3 space-y-2">
          {inquiries.length === 0 ? <p className="text-sm text-slate-500">No hay consultas.</p> : inquiries.map((iq: any) => (
            <div key={iq.id} className="rounded-xl border p-3 text-sm">
              <p className="font-semibold">{iq.product?.title}</p>
              <p className="text-slate-600">{iq.contactName ?? iq.user?.email} · {iq.message}</p>
              <select value={iq.status} onChange={(e) => onUpdateInquiry(iq.id, e.target.value)} className="mt-2 rounded-lg border px-2 py-1 text-xs">
                {INQUIRY_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Reportes ({reports.length})</h2>
        <div className="mt-3 space-y-2">
          {reports.length === 0 ? <p className="text-sm text-slate-500">No hay reportes.</p> : reports.map((r: any) => (
            <div key={r.id} className="rounded-xl border p-3 text-sm">
              <p className="font-semibold">{r.product?.title} · {r.reason}</p>
              <p className="text-slate-600">{r.description ?? "Sin descripción"} · Reportado por {r.reporter?.email}</p>
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100">{r.status}</span>
            </div>
          ))}
        </div>
      </article>

      {status && <p className="text-sm text-slate-700">{status}</p>}
    </section>
  );
}
