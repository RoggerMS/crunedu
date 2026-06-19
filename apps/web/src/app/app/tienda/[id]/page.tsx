"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StoreListingDetail } from "@/components/store/StoreListingDetail";
import { StoreSection } from "@/components/store/StoreSection";
import type { StoreListing } from "@/components/store/types";
import { getStoreProductDetail } from "@/lib/api-helpers";
import type { StoreProduct } from "@/lib/api-helpers";
import { apiRequest } from "@/lib/http-client";

const TOKEN_KEY = "crunedu_access_token";

function mapDetailToStoreListing(product: StoreProduct & { stock?: number; viewCount?: number }): StoreListing {
  return {
    id: String(product.id),
    type: "sale",
    title: product.title,
    description: product.description,
    price: Number(product.price) || undefined,
    currency: "PEN",
    category: "materials",
    status: "available",
    badges: product.isFeatured ? ["Destacado"] : [],
    images: [],
    seller: {
      id: "crunedu",
      name: "CrunEdu",
      rating: 5,
      verified: true,
      sales: 0,
    },
    location: "Campus UNE",
    deliveryType: "campus",
    tags: [],
    createdAt: product.createdAt ?? new Date().toISOString(),
    stats: { views: product.viewCount ?? 0, saves: 0, contacts: 0 },
    viewerState: { saved: false },
  };
}

export default function TiendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<StoreListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [sending, setSending] = useState(false);

  const pulseToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStoreProductDetail(Number(id));
        if (!cancelled) setItem(mapDetailToStoreListing(data));
      } catch {
        if (!cancelled) setError("Producto no encontrado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function sendInquiry() {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY)?.trim() : null;
    if (!token) {
      pulseToast("Inicia sesión para contactar al vendedor.");
      return;
    }
    if (!contactMessage.trim()) {
      pulseToast("Escribe un mensaje.");
      return;
    }
    setSending(true);
    try {
      await apiRequest(`/marketplace/products/${id}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactName: contactName.trim() || "Estudiante",
          contactPhone: contactPhone.trim() || "900000000",
          message: contactMessage.trim(),
          preferredContactMethod: "whatsapp",
        }),
      });
      pulseToast("Consulta enviada.");
      setContactMessage("");
    } catch {
      pulseToast("Error al enviar la consulta.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link>
        <p className="mt-4 text-sm text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/app/tienda" className="text-sm font-medium text-indigo-700">← Volver a Tienda</Link>
        <p className="mt-4 text-sm text-slate-600">{error ?? "Producto no disponible."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-6 py-4">
      <StoreListingDetail
        item={item}
        onContact={() => {}}
        onReserve={() => pulseToast("Función en desarrollo.")}
        onSave={() => pulseToast("Función en desarrollo.")}
        onShare={() => {
          navigator.clipboard.writeText(`${window.location.origin}/app/tienda/${id}`);
          pulseToast("Enlace copiado.");
        }}
        onReport={() => pulseToast("Función en desarrollo.")}
      />

      <StoreSection title="Descripción y etiquetas" subtitle="Información del producto.">
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-700">
          <p>{item.description}</p>
          {item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </StoreSection>

      <StoreSection title="Contactar al vendedor" subtitle="Envía una consulta sobre este producto.">
        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Tu nombre"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Celular (9 dígitos)"
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Escribe tu consulta..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={sendInquiry}
            disabled={sending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar consulta"}
          </button>
        </div>
      </StoreSection>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded bg-slate-900 px-3 py-2 text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
