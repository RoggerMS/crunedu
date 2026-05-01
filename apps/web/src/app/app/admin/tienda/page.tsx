"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createAdminProduct, getAdminStoreInquiries, getAdminStoreMetrics, getAdminStoreProducts, getStoreCategories, updateAdminStoreInquiryStatus } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

const INQUIRY_STATES = ["NEW", "CONTACTED", "CLOSED", "CANCELLED"] as const;

export default function AdminTiendaPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{ totals: { views: number; contactClicks: number; inquiries: number } } | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", categoryId: "", isFeatured: false, status: "ACTIVE" });
  const [status, setStatus] = useState<string | null>(null);

  async function loadAdminData() {
    if (!accessToken) return;

    try {
      const [catalogCategories, adminProducts, adminInquiries, adminMetrics] = await Promise.all([
        getStoreCategories(),
        getAdminStoreProducts(accessToken),
        getAdminStoreInquiries(accessToken),
        getAdminStoreMetrics(accessToken),
      ]);
      setCategories(Array.isArray(catalogCategories) ? catalogCategories : []);
      setProducts(Array.isArray(adminProducts) ? adminProducts : []);
      setInquiries(Array.isArray(adminInquiries?.items) ? adminInquiries.items : []);
      setMetrics(adminMetrics ?? null);
    } catch (err) {
      setStatus(mapApiError(err, "No se pudo cargar el panel de tienda."));
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [accessToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    try {
      await createAdminProduct({
        title: form.title,
        description: form.description,
        price: form.price,
        categoryId: Number(form.categoryId),
        status: form.status,
        isFeatured: form.isFeatured,
        stock: 1,
        contactMethod: "whatsapp",
      }, accessToken ?? "");
      setStatus("Producto guardado correctamente.");
      setForm({ title: "", description: "", price: "", categoryId: "", isFeatured: false, status: "ACTIVE" });
      await loadAdminData();
    } catch (err) {
      setStatus(mapApiError(err, "No se pudo guardar el producto."));
    }
  }

  async function onUpdateInquiryStatus(inquiryId: number, nextStatus: string) {
    if (!accessToken) return;
    try {
      await updateAdminStoreInquiryStatus(inquiryId, nextStatus, accessToken);
      setStatus("Estado de consulta actualizado.");
      await loadAdminData();
    } catch (err) {
      setStatus(mapApiError(err, "No se pudo actualizar el estado de la consulta."));
    }
  }

  if (!isAuthenticated) return <p className="text-sm text-slate-600">Inicia sesión para gestionar productos.</p>;

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">Admin tienda</h1>
        <p className="mt-1 text-sm text-slate-600">Gestión de productos, consultas y métricas. Preparado para pagos futuros sin implementarlos aún.</p>
        {metrics ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Vistas: <strong>{metrics.totals.views}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Clics de contacto: <strong>{metrics.totals.contactClicks}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Consultas: <strong>{metrics.totals.inquiries}</strong></p>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Gestionar productos</h2>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Descripción" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
          <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Precio" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} required />
          <select className="rounded-xl border border-slate-200 px-3 py-2" value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} required>
            <option value="">Selecciona categoría</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="ACTIVE">Activo</option>
            <option value="DRAFT">Inactivo (borrador)</option>
            <option value="HIDDEN">Inactivo (oculto)</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))} /> Marcar como destacado</label>
          <button className="w-fit rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">Guardar producto</button>
        </form>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Productos actuales</h2>
        <div className="mt-3 space-y-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-semibold">{product.title} {product.isFeatured ? "· Destacado" : ""}</p>
              <p className="text-slate-600">{product.category?.name} · Estado: {product.status}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Consultas de productos</h2>
        <div className="mt-3 space-y-2">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-semibold">{inquiry.product?.title}</p>
              <p className="text-slate-600">{inquiry.contactName} · {inquiry.contactPhone}</p>
              <p className="mt-1">{inquiry.message}</p>
              <select className="mt-2 rounded-lg border border-slate-200 px-2 py-1" value={inquiry.status} onChange={(e) => onUpdateInquiryStatus(inquiry.id, e.target.value)}>
                {INQUIRY_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>
          ))}
        </div>
      </article>
      {status ? <p className="text-sm">{status}</p> : null}
    </section>
  );
}
