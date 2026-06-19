"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, X, Plus } from "lucide-react";
import { StoreListingFallbackMedia } from "@/components/store/StoreListingFallbackMedia";
import { useAuth } from "@/providers/auth-provider";
import { createStoreProduct, uploadStoreProductImage, getStoreCategories, getStoreSafePoints, type StoreCategory, type StoreSafePoint, type StoreImageUpload, type StoreCreatePayload } from "@/lib/api-helpers";

const PRODUCT_TYPES = [
  { value: "SALE", label: "Venta", desc: "Ofrece un producto" },
  { value: "SERVICE", label: "Servicio", desc: "Ofrece tu servicio" },
  { value: "EXCHANGE", label: "Intercambio", desc: "Cambia sin dinero" },
  { value: "DONATION", label: "Donación", desc: "Regala a la comunidad" },
  { value: "RENTAL", label: "Alquiler", desc: "Alquila temporalmente" },
  { value: "REQUEST", label: "Solicitud", desc: "Busca algo que necesitas" },
] as const;

const PRICE_TYPES = [
  { value: "FIXED", label: "Precio fijo" },
  { value: "NEGOTIABLE", label: "Negociable" },
  { value: "FREE", label: "Gratis" },
  { value: "CONTACT", label: "Consultar precio" },
  { value: "EXCHANGE", label: "Intercambio" },
  { value: "HOURLY", label: "Por hora" },
  { value: "FROM", label: "Desde" },
] as const;

const DELIVERY_TYPES = [
  { value: "CAMPUS", label: "En campus" },
  { value: "SAFE_POINT", label: "Punto seguro" },
  { value: "PICKUP", label: "Recojo" },
  { value: "COORDINATED", label: "Coordinado" },
  { value: "SHIPPING", label: "Envío" },
  { value: "DIGITAL", label: "Digital" },
] as const;

const CONDITIONS = [
  { value: "NEW", label: "Nuevo" },
  { value: "LIKE_NEW", label: "Como nuevo" },
  { value: "GOOD", label: "Buen estado" },
  { value: "USED", label: "Usado" },
  { value: "WITH_DETAILS", label: "Con detalles" },
  { value: "NOT_APPLICABLE", label: "No aplica" },
] as const;

export default function NuevoProductoPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuth();
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [safePoints, setSafePoints] = useState<StoreSafePoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadedImages, setUploaded] = useState<StoreImageUpload[]>([]);
  const [uploadingImages, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(0);
  const [type, setType] = useState("SALE");
  const [priceType, setPriceType] = useState("FIXED");
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [condition, setCondition] = useState("");
  const [deliveryType, setDeliveryType] = useState("CAMPUS");
  const [campus, setCampus] = useState("");
  const [safePointId, setSafePointId] = useState(0);
  const [course, setCourse] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getStoreCategories().then(setCategories).catch(() => {});
    getStoreSafePoints().then(setSafePoints).catch(() => {});
  }, []);

  const errors = useMemo(() => ({
    title: !title.trim(),
    description: !description.trim() || description.length < 10,
    category: !categoryId,
  }), [title, description, categoryId]);

  async function uploadImages(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    const token = accessToken ?? "";
    const results: StoreImageUpload[] = [];
    for (const file of files.slice(0, 6)) {
      try {
        const uploaded = await uploadStoreProductImage(file, token);
        results.push({ imageUrl: uploaded.imageUrl, storageKey: uploaded.storageKey, mimeType: uploaded.mimeType, sizeBytes: uploaded.sizeBytes });
      } catch { setToast("Error al subir una imagen."); }
    }
    setUploaded((prev) => [...prev, ...results].slice(0, 6));
    setImageFiles([]);
    setUploading(false);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setImageFiles((prev) => [...prev, ...files].slice(0, 6 - uploadedImages.length));
      e.target.value = "";
    }
  }

  useEffect(() => {
    if (imageFiles.length > 0) uploadImages(imageFiles);
  }, [imageFiles]);

  function removeUploadedImage(index: number) {
    setUploaded((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(status: "DRAFT" | "ACTIVE" = "ACTIVE") {
    if (!isAuthenticated) { setToast("Inicia sesión para publicar."); return; }
    if (!title.trim() || !description.trim() || !categoryId) return;

    setSaving(true);
    setToast(null);

    const payload: StoreCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      type,
      priceType,
      isNegotiable,
      deliveryType,
      status,
      campus: campus.trim() || undefined,
      safePointId: safePointId || undefined,
      course: course.trim() || undefined,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      quantity,
      images: uploadedImages.length > 0 ? uploadedImages.map((img, i) => ({ ...img, isCover: i === 0 })) : undefined,
    };

    if (priceType !== "FREE" && priceType !== "CONTACT" && priceType !== "EXCHANGE") {
      payload.price = Number(price) || 0;
    }

    if (condition) payload.condition = condition;

    try {
      const token = accessToken ?? "";
      const result = await createStoreProduct(payload, token);
      setToast(status === "DRAFT" ? "Borrador guardado." : "Producto publicado.");
      router.push(`/app/tienda/${result.id}`);
    } catch (err: any) {
      setToast(err?.message ?? "Error al publicar.");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8 text-center">
        <h1 className="text-2xl font-black">Publicar en Tienda</h1>
        <p className="mt-2 text-sm text-slate-600">Inicia sesión para publicar tus productos.</p>
        <Link href="/login" className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <h1 className="text-2xl font-black">Publicar en Tienda</h1>
      <p className="mt-1 text-sm text-slate-600">Completa la información de tu producto o servicio.</p>

      {toast && <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${toast.includes("Error") ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{toast}</div>}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-semibold">Tipo de publicación</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRODUCT_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => { setType(pt.value); if (pt.value === "DONATION" || pt.value === "EXCHANGE") setPriceType(pt.value === "DONATION" ? "FREE" : "EXCHANGE"); }}
                  className={`rounded-lg border p-2 text-left text-xs transition ${type === pt.value ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}
                >
                  <span className="font-semibold">{pt.label}</span>
                  <span className="block text-slate-500">{pt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-semibold">Imágenes ({uploadedImages.length}/6)</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg border overflow-hidden">
                  <img src={img.imageUrl} alt={`Imagen ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeUploadedImage(i)} className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {uploadedImages.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
                >
                  {uploadingImages ? <span className="text-xs">...</span> : <Plus className="h-5 w-5" />}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageSelect} className="hidden" />
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="text-sm font-semibold">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Calculadora Casio fx-991ES" maxLength={200} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            {errors.title && <p className="mt-0.5 text-xs text-rose-600">Ingresa un título.</p>}
          </div>

          <div>
            <label className="text-sm font-semibold">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe tu producto en detalle..." rows={4} maxLength={3000} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            {errors.description && <p className="mt-0.5 text-xs text-rose-600">Mínimo 10 caracteres.</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-semibold">Categoría</label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
              <option value={0}>Selecciona categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.category && <p className="mt-0.5 text-xs text-rose-600">Selecciona una categoría.</p>}
          </div>

          {/* Price */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Tipo de precio</label>
              <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                {PRICE_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
            </div>
            {priceType !== "FREE" && priceType !== "CONTACT" && priceType !== "EXCHANGE" && (
              <div>
                <label className="text-sm font-semibold">Precio (S/)</label>
                <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            )}
          </div>

          {priceType === "FIXED" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} /> Precio negociable
            </label>
          )}

          {/* Condition */}
          {type !== "SERVICE" && (
            <div>
              <label className="text-sm font-semibold">Condición</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Selecciona</option>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          {/* Brand/Model */}
          {type === "SALE" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Marca</label>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Casio" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold">Modelo</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ej: fx-991ES" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-sm font-semibold">Cantidad</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          {/* Course */}
          <div>
            <label className="text-sm font-semibold">Curso relacionado (opcional)</label>
            <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Ej: Matemática I" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          {/* Delivery */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Tipo de entrega</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                {DELIVERY_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
              </select>
            </div>
            {deliveryType === "SAFE_POINT" && (
              <div>
                <label className="text-sm font-semibold">Punto seguro</label>
                <select value={safePointId} onChange={(e) => setSafePointId(Number(e.target.value))} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value={0}>Selecciona</option>
                  {safePoints.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
              </div>
            )}
            {deliveryType !== "DIGITAL" && deliveryType !== "SAFE_POINT" && deliveryType !== "SHIPPING" && (
              <div>
                <label className="text-sm font-semibold">Ubicación en campus</label>
                <input value={campus} onChange={(e) => setCampus(e.target.value)} placeholder="Ej: Biblioteca Central" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex gap-2">
            <button type="submit" disabled={saving || errors.title || errors.description || errors.category} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Publicando..." : "Publicar"}
            </button>
            <button type="button" onClick={() => submit("DRAFT")} disabled={saving || !title.trim()} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Guardar borrador
            </button>
            <Link href="/app/tienda" className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancelar</Link>
          </div>
        </form>

        {/* Preview */}
        <div className="rounded-2xl border bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold">Vista previa</p>
          {uploadedImages.length > 0 ? (
            <div className="h-44 rounded-xl overflow-hidden mb-3">
              <img src={uploadedImages[0].imageUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          ) : (
            <StoreListingFallbackMedia
              categorySlug={categories.find((c) => c.id === categoryId)?.slug}
              iconKey={categories.find((c) => c.id === categoryId)?.icon}
            />
          )}
          <p className="mt-3 font-semibold text-slate-900">{title || "Título del producto"}</p>
          <p className="text-lg font-black text-indigo-700">
            {priceType === "FREE" ? "Gratis" : priceType === "EXCHANGE" ? "Intercambio" : priceType === "CONTACT" ? "Consultar" : price ? `S/ ${price}` : "Precio"}
          </p>
          <p className="mt-1 text-xs text-slate-600">{type === "SALE" ? "Venta" : type === "SERVICE" ? "Servicio" : type === "EXCHANGE" ? "Intercambio" : type === "DONATION" ? "Donación" : type}</p>
          <p className="mt-2 text-sm text-slate-600">{description || "Descripción de tu publicación"}</p>
        </div>
      </div>
    </div>
  );
}
