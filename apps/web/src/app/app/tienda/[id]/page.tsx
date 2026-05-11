"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { StoreListingDetail } from "@/components/store/StoreListingDetail";
import { StoreListingGrid } from "@/components/store/StoreListingGrid";
import { StoreSection } from "@/components/store/StoreSection";
import { useStore } from "@/hooks/useStore";

const quickQuestions = ["¿Sigue disponible?", "¿La batería funciona bien?", "¿Entregas hoy?", "¿Aceptas intercambio?"];

export default function TiendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const [prefilledMessage, setPrefilledMessage] = useState<string | null>(null);
  const item = store.getListingById(id);

  if (!item) return <p className="mx-auto max-w-4xl px-6 py-8">Producto no disponible.</p>;

  const similar = store.getSimilarListings(id);

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-6 py-4">
      <StoreListingDetail item={item} onContact={() => store.contactSeller(item.title)} onReserve={() => store.reserveListing(item.id)} onSave={() => store.saveListing(item.id)} onShare={() => store.shareListing(item.id)} onReport={store.reportListing} />

      <StoreSection title="Descripción y etiquetas" subtitle="Información clave del producto.">
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-700">
          <p>{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1">#{tag}</span>
            ))}
          </div>
        </div>
      </StoreSection>

      <StoreSection title="Consultas frecuentes" subtitle="Envía una consulta rápida al vendedor.">
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button key={question} type="button" onClick={() => { setPrefilledMessage(question); store.contactSeller(`${item.title}: ${question}`); }} className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:border-indigo-300">{question}</button>
          ))}
        </div>
        {prefilledMessage ? <p className="text-xs text-slate-600">Consulta enviada: {prefilledMessage}</p> : null}
      </StoreSection>

      <StoreSection title="Productos similares" subtitle="Sugerencias por categoría y etiquetas relacionadas.">
        {similar.length > 0 ? <StoreListingGrid items={similar} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /> : <div className="rounded-2xl border border-dashed bg-white p-5 text-center text-sm text-slate-600">No encontramos similares por ahora.</div>}
      </StoreSection>
    </div>
  );
}
