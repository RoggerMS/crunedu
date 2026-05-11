"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { UniversityCalendarPreview } from "@/components/university/UniversityCalendarPreview";
import { UniversityFilters } from "@/components/university/UniversityFilters";
import { UniversityHeader } from "@/components/university/UniversityHeader";
import { UniversityItemCard } from "@/components/university/UniversityItemCard";
import { UniversitySidebar } from "@/components/university/UniversitySidebar";
import { useUniversity } from "@/hooks/useUniversity";

export default function UniversidadPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const { items, selectedFilter, setSelectedFilter, saveItem, shareItem, addToCalendar, downloadFile, toast } = useUniversity(params.get("q") ?? "");

  return <section className="space-y-5"><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-4"><div className="grid gap-4 lg:grid-cols-2"><UniversityHeader onSuggest={() => setShowSuggest(true)} onCalendar={() => router.push("/app/universidad/calendario")} onSaved={() => setSelectedFilter("Guardados")} /><UniversityCalendarPreview /></div><UniversityFilters selected={selectedFilter} onChange={setSelectedFilter} /><div className="space-y-3">{items.map((item) => <UniversityItemCard key={item.id} item={item} onSave={() => saveItem(item.id)} onShare={() => void shareItem(item.id)} onCalendar={addToCalendar} onDownload={() => downloadFile(item)} />)}</div></div><UniversitySidebar onHelp={() => setShowHelp(true)} /></div>
  {showHelp ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-5"><h2 className="text-xl font-bold">Ayuda y contacto</h2><p className="text-sm text-slate-600">Encuentra el contacto correcto según el área o trámite que necesitas.</p><button className="mt-3 rounded border px-3 py-2" onClick={() => setShowHelp(false)}>Cerrar</button></div></div> : null}
  {showSuggest ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"><div className="w-full max-w-2xl rounded-2xl bg-white p-5"><h2 className="text-xl font-bold">Sugerir información</h2><p className="text-sm text-slate-600">Envía una sugerencia para revisión.</p><button className="mt-3 rounded border px-3 py-2" onClick={() => setShowSuggest(false)}>Cerrar</button></div></div> : null}
  {toast ? <div className="fixed bottom-5 right-5 rounded bg-slate-900 px-3 py-2 text-sm text-white">{toast}</div> : null}
  </section>;
}
