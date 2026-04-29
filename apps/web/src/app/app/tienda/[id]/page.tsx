"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [product, setProduct] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/marketplace/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch(() => setProduct(null));
  }, [params.id]);

  async function sendInterest() {
    if (!isAuthenticated) {
      setMessage("Inicia sesión para enviar tu interés.");
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/marketplace/products/${params.id}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contactName: "Estudiante CrunEdu",
          contactPhone: "999999999",
          message: "Hola, estoy interesado en este producto.",
          preferredContactMethod: "whatsapp",
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo registrar tu interés.");
      }

      setMessage("Interés enviado. Pronto te contactaremos.");
    } catch {
      setMessage("No se pudo registrar tu interés.");
    } finally {
      setSending(false);
    }
  }

  if (!product?.id) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-4">Producto no disponible.</p>;
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
