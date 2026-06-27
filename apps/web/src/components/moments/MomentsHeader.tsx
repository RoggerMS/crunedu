"use client";
import { Bell, ChevronLeft, LayoutGrid, MessageCircle, Search, UserCircle2, Columns2 } from "lucide-react";
import Link from "next/link";
import type { MomentView } from "./types";
import { MomentsTabs } from "./MomentsTabs";
import type { MomentsViewMode } from "@/hooks/useMoments";

const placeholders: Record<MomentView, string> = { moments: "Buscar momentos, eventos, lugares...", news: "Buscar noticias, temas o lugares...", gallery: "Buscar fotos, momentos o lugares...", saved: "Buscar guardados...", trends: "Buscar tendencias..." };

export function MomentsHeader({
  activeView,
  setActiveView,
  query,
  setQuery,
  viewMode,
  onChangeViewMode,
}: {
  activeView: MomentView;
  setActiveView: (view: MomentView) => void;
  query: string;
  setQuery: (value: string) => void;
  viewMode: MomentsViewMode;
  onChangeViewMode: (mode: MomentsViewMode) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-2 lg:gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-indigo-600 p-2 text-white">🎓</span>
          <Link href="/app" className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><ChevronLeft size={16} />Volver a CrunEdu</Link>
        </div>
        <div className="order-2 flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:max-w-[520px]">
          <Search size={16} className="text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholders[activeView]} className="w-full bg-transparent text-sm outline-none" />
        </div>
        <MomentsTabs activeView={activeView} setActiveView={setActiveView} />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onChangeViewMode(viewMode === "single" ? "explore" : "single")}
            title={viewMode === "single" ? "Cambiar a Explorar" : "Cambiar a Uno por uno"}
            aria-label="Cambiar modo de visualización"
            className="rounded-xl border border-slate-200 p-2"
          >
            {viewMode === "single" ? <LayoutGrid size={16} /> : <Columns2 size={16} />}
          </button>
          <button className="rounded-xl border border-slate-200 p-2"><Bell size={16} /></button>
          <button className="rounded-xl border border-slate-200 p-2"><MessageCircle size={16} /></button>
          <button className="rounded-xl border border-slate-200 p-2"><UserCircle2 size={16} /></button>
        </div>
      </div>
    </header>
  );
}
