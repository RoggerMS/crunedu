"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { mapApiError } from "@/lib/api";
import { createStoreInquiry, getStoreProductDetail, ProductDetailResponse } from "@/lib/api-helpers";

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>();
  const { accessToken, isAuthenticated } = useAccessToken();
  const productId = Number(params.id);
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(productId)) {
      setLoading(false);
      setError("Producto no válido.");
      return;
    }

    setLoading(true);
    setError(null);
    getStoreProductDetail(productId)
      .then((data) => setProduct(data))
      .catch((err) => {
        setProduct(null);
        setError(mapApiError(err, "No pudimos cargar este producto."));
      })
      .finally(() => setLoading(false));
  }, [productId]);

  async function sendInterest() {
    if (!isAuthenticated) {
      setMessage("Inicia sesión para enviar tu interés.");
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      await createStoreInquiry(
        productId,
        {
          contactName: "Estudiante CrunEdu",
          contactPhone: "999999999",
          message: "Hola, estoy interesado en este producto.",
          preferredContactMethod: "whatsapp",
        },
        accessToken,
      );

      setMessage("Interés enviado. Pronto te contactaremos.");
    } catch (err) {
      setMessage(mapApiError(err, "No se pudo registrar tu interés."));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-4">Cargando producto...</p>;
  }

  if (error) {
    return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p>;
  }

  if (!product?.id) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-4">Producto no disponible en este momento.</p>;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-xs font-semibold text-slate-500">{product.category?.name}</p>
      <h1 className="mt-1 text-2xl font-black">{product.title}</h1>
      <p className="mt-3 text-slate-700">{product.description}</p>
      <p className="mt-4 text-xl font-bold">S/ {product.price}</p>
      <button onClick={sendInterest} disabled={sending} className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {sending ? "Enviando..." : "Me interesa este producto"}
      </button>
      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
