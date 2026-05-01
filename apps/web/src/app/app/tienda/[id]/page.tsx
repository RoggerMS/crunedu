"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { PageState, PrimaryButton } from "@/components/ui";
import { mapApiError } from "@/lib/http-client";
import { createStoreInquiry, getStoreProductDetail, type ProductDetailResponse } from "@/lib/api-helpers";

type FormState = {
  contactName: string;
  contactPhone: string;
  message: string;
  preferredContactMethod: "whatsapp" | "email";
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>();
  const { accessToken, isAuthenticated } = useAccessToken();
  const productId = Number(params.id);
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    contactName: "",
    contactPhone: "",
    message: "",
    preferredContactMethod: "whatsapp",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const loadProduct = useCallback(() => {
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

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  function validateForm(): boolean {
    const errors: FormErrors = {};

    if (!formData.contactName.trim()) {
      errors.contactName = "El nombre es obligatorio.";
    } else if (formData.contactName.trim().length < 2) {
      errors.contactName = "El nombre debe tener al menos 2 caracteres.";
    } else if (formData.contactName.length > 100) {
      errors.contactName = "El nombre no puede exceder 100 caracteres.";
    }

    if (!formData.contactPhone.trim()) {
      errors.contactPhone = "El teléfono es obligatorio.";
    } else if (!/^9\d{8}$/.test(formData.contactPhone.trim())) {
      errors.contactPhone = "Ingresa un número de celular válido (9 dígitos, ej: 987654321).";
    }

    if (!formData.message.trim()) {
      errors.message = "El mensaje es obligatorio.";
    } else if (formData.message.trim().length < 5) {
      errors.message = "El mensaje debe tener al menos 5 caracteres.";
    } else if (formData.message.length > 500) {
      errors.message = "El mensaje no puede exceder 500 caracteres.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function sendInterest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isAuthenticated) {
      setResultMessage({ type: "error", text: "Inicia sesión para enviar tu interés." });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSending(true);
    setResultMessage(null);

    try {
      await createStoreInquiry(productId, formData, accessToken);
      setResultMessage({
        type: "success",
        text: "Interés registrado. Pronto el vendedor se pondrá en contacto contigo.",
      });
      setFormData({
        contactName: "",
        contactPhone: "",
        message: "",
        preferredContactMethod: "whatsapp",
      });
      setFormErrors({});
    } catch (err) {
      setResultMessage({
        type: "error",
        text: mapApiError(err, "No se pudo registrar tu interés. Intenta nuevamente."),
      });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <PageState type="loading" title="Cargando producto" description="Estamos preparando el detalle del producto." />;
  }

  if (error) {
    return (
      <PageState
        type="error"
        title="No se pudo cargar el producto"
        description={error}
        action={<PrimaryButton type="button" onClick={loadProduct}>Reintentar</PrimaryButton>}
      />
    );
  }

  if (!product?.id) {
    return <PageState type="empty" title="Producto no disponible" description="Este producto no está disponible en este momento." />;
  }

  return (
    <section className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold text-slate-500">{product.category?.name}</p>
        <h1 className="mt-1 text-2xl font-black">{product.title}</h1>
        <p className="mt-3 text-slate-700">{product.description}</p>
        <p className="mt-4 text-xl font-bold">S/ {product.price}</p>
      </article>

      <form onSubmit={sendInterest} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-bold">Registra tu interés</h2>
        <p className="mt-2 text-sm text-slate-600">Completa el formulario para contactar rápido con CrunEdu y separar este producto.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-semibold text-slate-700">
              Tu nombre
            </label>
            <input
              id="contactName"
              type="text"
              maxLength={100}
              value={formData.contactName}
              onChange={(e) => {
                setFormData({ ...formData, contactName: e.target.value });
                if (formErrors.contactName) setFormErrors({ ...formErrors, contactName: undefined });
              }}
              placeholder="Ej: Juan Pérez"
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={sending}
            />
            {formErrors.contactName && <p className="mt-1 text-xs text-rose-600">{formErrors.contactName}</p>}
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-semibold text-slate-700">
              Tu celular
            </label>
            <input
              id="contactPhone"
              type="tel"
              maxLength={9}
              value={formData.contactPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                setFormData({ ...formData, contactPhone: val });
                if (formErrors.contactPhone) setFormErrors({ ...formErrors, contactPhone: undefined });
              }}
              placeholder="Ej: 987654321"
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={sending}
            />
            {formErrors.contactPhone && <p className="mt-1 text-xs text-rose-600">{formErrors.contactPhone}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
              Tu mensaje ({formData.message.length}/500)
            </label>
            <textarea
              id="message"
              maxLength={500}
              rows={3}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (formErrors.message) setFormErrors({ ...formErrors, message: undefined });
              }}
              placeholder="Ej: Hola, me interesa este producto. ¿Cuál es tu disponibilidad?"
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={sending}
            />
            {formErrors.message && <p className="mt-1 text-xs text-rose-600">{formErrors.message}</p>}
          </div>

          <div>
            <label htmlFor="method" className="block text-sm font-semibold text-slate-700">
              Preferencia de contacto
            </label>
            <select
              id="method"
              value={formData.preferredContactMethod}
              onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value as "whatsapp" | "email" })}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={sending}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Correo electrónico</option>
            </select>
          </div>
        </div>

        {resultMessage && (
          <div
            className={`mt-5 rounded-lg px-4 py-3 text-sm ${
              resultMessage.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {resultMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Enviando solicitud..." : "Quiero este producto · Contactar ahora"}
        </button>
      </form>
    </section>
  );
}
