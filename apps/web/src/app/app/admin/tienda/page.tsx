"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function AdminTiendaPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", description: "", price: "", categoryId: "", isFeatured: false });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/marketplace/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    try {
      const response = await fetch(`${API_URL}/marketplace/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: form.price,
          categoryId: Number(form.categoryId),
          status: "ACTIVE",
          isFeatured: form.isFeatured,
          stock: 1,
          contactMethod: "whatsapp",
        }),
      });

      if (!response.ok) throw new Error();
      setStatus("Producto guardado correctamente.");
      setForm({ title: "", description: "", price: "", categoryId: "", isFeatured: false });
    } catch {
      setStatus("No se pudo guardar el producto.");
    }
  }

  if (!isAuthenticated) return <p className="text-sm text-slate-600">Inicia sesión para gestionar productos.</p>;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-black">Admin tienda (mínimo)</h1>
      <p className="mt-1 text-sm text-slate-600">Panel básico para crear productos sin carrito ni pagos.</p>
      <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
        <textarea className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Descripción" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} required />
        <input className="rounded-xl border border-slate-200 px-3 py-2" placeholder="Precio" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} required />
        <select className="rounded-xl border border-slate-200 px-3 py-2" value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} required>
          <option value="">Selecciona categoría</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))} /> Marcar como destacado</label>
        <button className="w-fit rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">Guardar producto</button>
      </form>
      {status ? <p className="mt-3 text-sm">{status}</p> : null}
    </section>
  );
}
