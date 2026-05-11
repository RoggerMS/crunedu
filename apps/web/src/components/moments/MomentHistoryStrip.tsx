import type { MomentItem } from "./types";
import { MomentHistoryCard } from "./MomentHistoryCard";
export function MomentHistoryStrip({ moments, selectFromHistory }: { moments: MomentItem[]; selectFromHistory: (id: string)=>void }) { return <div className="mt-4 flex gap-3 overflow-x-auto pb-2">{moments.map((m)=><MomentHistoryCard key={m.id} moment={m} onClick={()=>selectFromHistory(m.id)} />)}<button className="rounded-full border bg-white px-4">→</button></div>; }
