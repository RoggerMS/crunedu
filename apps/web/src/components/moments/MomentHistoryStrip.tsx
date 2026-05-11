import { ArrowRight } from "lucide-react";
import type { MomentItem } from "./types";
import { MomentHistoryCard } from "./MomentHistoryCard";

export function MomentHistoryStrip({ moments, currentMomentId, selectFromHistory }: { moments: MomentItem[]; currentMomentId?: string; selectFromHistory: (id: string)=>void }) { return <div className="mt-2 flex gap-3 overflow-x-auto pb-1">{moments.map((m)=><MomentHistoryCard key={m.id} moment={m} active={m.id === currentMomentId} onClick={()=>selectFromHistory(m.id)} />)}<button title="Ver historial" aria-label="Ver historial" className="grid h-[80px] min-w-[56px] place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:shadow-sm"><ArrowRight className="h-5 w-5" /></button></div>; }
