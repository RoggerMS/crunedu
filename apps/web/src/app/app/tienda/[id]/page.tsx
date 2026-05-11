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
    <div className="mx-auto max-w-[1500px] space-y-6 px-6 py-6">
      <StoreListingDetail item={item} onContact={() => store.contactSeller(item.title)} onReserve={() => store.reserveListing(item.id)} onSave={() => store.saveListing(item.id)} onShare={() => store.shareListing(item.id)} onReport={store.reportListing} />
      <StoreSection title="Consultas frecuentes" subtitle="Envía una consulta rápida al vendedor.">
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question) => (
            <button key={question} type="button" onClick={() => { setPrefilledMessage(question); store.contactSeller(`${item.title}: ${question}`); }} className="rounded-xl border bg-white px-3 py-2 text-sm hover:border-indigo-300">{question}</button>
          ))}
        </div>
        {prefilledMessage ? <p className="text-sm text-slate-600">Consulta enviada: {prefilledMessage}</p> : null}
      </StoreSection>
      <StoreSection title="Productos similares" subtitle="Sugerencias por categoría y etiquetas relacionadas.">
        {similar.length > 0 ? <StoreListingGrid items={similar} onSave={store.saveListing} onContact={store.contactSeller} onShare={store.shareListing} onReport={store.reportListing} onHide={store.hideListing} /> : <div className="rounded-2xl border border-dashed bg-white p-6 text-center text-slate-600">No encontramos similares por ahora.</div>}
      </StoreSection>
    </div>
  );
}
