"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { PageState, PrimaryButton } from "@/components/ui";
import { createAdminProduct, getAdminStoreInquiries, getAdminStoreMetrics, getAdminStoreProducts, getStoreCategories, updateAdminStoreInquiryStatus } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

const INQUIRY_STATES = ["NEW", "CONTACTED", "CLOSED", "CANCELLED"] as const;

type ProductForm = { title: string; description: string; price: string; categoryId: string; isFeatured: boolean; status: "ACTIVE" | "DRAFT" | "HIDDEN" };

export default function AdminTiendaPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<{ totals: { views: number; contactClicks: number; inquiries: number }; inquirySummary: { total: number; completed: number } } | null>(null);
  const [form, setForm] = useState<ProductForm>({ title: "", description: "", price: "", categoryId: "", isFeatured: false, status: "ACTIVE" });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  async function loadAdminData() {
    if (!accessToken) return;
    setLoading(true);
    setLoadingError(null);
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
      setLoadingError(mapApiError(err, "No se pudo cargar el panel de tienda."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [accessToken]);

  function validateProductForm() {
    if (form.title.trim().length < 3) return "El título debe tener al menos 3 caracteres.";
    if (form.description.trim().length < 10) return "La descripción debe tener al menos 10 caracteres.";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) return "El precio debe ser mayor a 0.";
    if (!form.categoryId) return "Selecciona una categoría.";
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    const validationError = validateProductForm();
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      setSaving(true);
      await createAdminProduct({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
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
    } finally {
      setSaving(false);
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
  if (loading) return <PageState type="loading" title="Cargando admin tienda" description="Estamos cargando productos, consultas y métricas." />;
  if (loadingError) return <PageState type="error" title="No se pudo cargar el panel" description={loadingError} action={<PrimaryButton type="button" onClick={loadAdminData}>Reintentar</PrimaryButton>} />;

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">Admin tienda</h1>
        <p className="mt-1 text-sm text-slate-600">Esta tienda no procesa pagos automáticos. Solo registra interés para contacto manual de CrunEdu.</p>
        {metrics ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Vistas: <strong>{metrics.totals.views}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Intereses enviados: <strong>{metrics.totals.contactClicks}</strong></p>
            <p className="rounded-xl bg-slate-50 p-3 text-sm">Consultas registradas: <strong>{metrics.totals.inquiries}</strong></p>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Gestionar productos</h2>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required minLength={3} maxLength={200} />
          <textarea className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Descripción" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required minLength={10} maxLength={2000} />
          <input type="number" min="1" step="0.01" className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Precio" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} required />
          <select className="rounded-xl border border-slate-200 px-3 py-2" value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} required>
            <option value="">Selecciona categoría</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProductForm["status"] }))}>
            <option value="ACTIVE">Activo</option>
            <option value="DRAFT">Inactivo (borrador)</option>
            <option value="HIDDEN">Inactivo (oculto)</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))} /> Marcar como destacado</label>
          <button disabled={saving} className="w-fit rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar producto"}</button>
        </form>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-bold">Productos actuales</h2>
        <div className="mt-3 space-y-2">
          {products.length === 0 ? <p className="text-sm text-slate-500">No hay productos registrados aún.</p> : products.map((product) => (
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
          {inquiries.length === 0 ? <p className="text-sm text-slate-500">No hay consultas registradas todavía.</p> : inquiries.map((inquiry) => (
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
