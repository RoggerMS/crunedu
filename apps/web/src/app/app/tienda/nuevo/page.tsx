"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { StoreListingFallbackMedia } from "@/components/store/StoreListingFallbackMedia";
import type { StoreCategory, StoreDeliveryType, StoreListingType } from "@/components/store/types";
import { useStore } from "@/hooks/useStore";

export default function NuevoProductoPage() {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<StoreListingType>("sale");
  const [category, setCategory] = useState<StoreCategory>("books");
  const [deliveryType, setDeliveryType] = useState<StoreDeliveryType>("campus");
  const [price, setPrice] = useState("");
  const [priceLabel, setPriceLabel] = useState("");
  const errors = useMemo(
    () => ({
      title: !title.trim(),
      description: !description.trim(),
      price: type !== "donation" && type !== "exchange" && !price,
    }),
    [description, price, title, type],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (errors.title || errors.description || errors.price) return;
    store.createListing();
  }

  return (
    <div className="mx-auto max-w-6xl rounded-3xl border bg-white p-6">
      <h1 className="text-2xl font-bold">Publicar en Tienda</h1>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        En esta fase Beta, la tienda es administrada por CrunEdu. Contáctanos para publicar tus productos.
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border p-2.5" disabled />
          {errors.title ? <p className="text-xs text-rose-600">Ingresa un título.</p> : null}
          <textarea placeholder="Descripción" value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border p-2.5" disabled />
          <select value={type} onChange={(event) => setType(event.target.value as StoreListingType)} className="w-full rounded-xl border p-2.5" disabled><option value="sale">Venta</option><option value="exchange">Intercambio</option><option value="donation">Donación</option><option value="service">Servicio</option><option value="student_business">Emprendimiento</option></select>
          <input placeholder="Precio" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^\d.]/g, ""))} className="w-full rounded-xl border p-2.5" disabled />
          {errors.price ? <p className="text-xs text-rose-600">Ingresa un precio o usa etiqueta textual.</p> : null}
          <input placeholder="Precio textual opcional" value={priceLabel} onChange={(event) => setPriceLabel(event.target.value)} className="w-full rounded-xl border p-2.5" disabled />
          <select value={category} onChange={(event) => setCategory(event.target.value as StoreCategory)} className="w-full rounded-xl border p-2.5" disabled><option value="books">Libros</option><option value="services">Servicios</option><option value="calculators">Calculadoras</option><option value="materials">Materiales</option><option value="free">Gratis</option></select>
          <select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value as StoreDeliveryType)} className="w-full rounded-xl border p-2.5" disabled><option value="campus">En campus</option><option value="safe_point">Punto seguro</option><option value="near_campus">Cerca del campus</option><option value="off_campus">Fuera de campus</option><option value="virtual">Virtual</option></select>
          {deliveryType === "off_campus" ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">Las entregas fuera de campus requieren coordinación con precaución.</div> : null}
          <div className="flex gap-2"><button type="button" disabled onClick={() => store.saveDraft({ title, description, type, category, deliveryType, price, priceLabel })} className="rounded-xl border px-4 py-2 opacity-50">Guardar borrador</button><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-white opacity-70">Vista previa</button></div>
        </form>
        <div className="rounded-2xl border bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold">Vista previa</p>
          <StoreListingFallbackMedia category={category} />
          <p className="mt-3 font-semibold">{title || "Título del producto"}</p>
          <p className="text-sm text-slate-600">{description || "Descripción de tu publicación"}</p>
        </div>
      </div>
    </div>
  );
}
