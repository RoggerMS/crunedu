import { Heart } from "lucide-react";
import { MomentMediaFallback } from "./MomentMediaFallback";
import { buildMomentMediaUrl } from "@/lib/moments-api";
import type { MomentItem } from "./types";

export function MomentHistoryCard({ moment, onClick, active }: { moment: MomentItem; onClick: () => void; active?: boolean }) {
  const mediaSrc = moment.media[0]?.url ? buildMomentMediaUrl(moment.media[0].url) : null;
  return (
    <button onClick={onClick} className={`group flex h-[80px] min-w-[240px] items-center gap-3 rounded-2xl border bg-white p-2 pr-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"}`}>
      <div className="h-16 w-16 overflow-hidden rounded-xl">
        {mediaSrc ? <img src={mediaSrc} alt={moment.title} className="h-16 w-16 rounded-xl object-cover" /> : <MomentMediaFallback momentType={moment.type} title={moment.title} compact />}
      </div>
      <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-slate-800">{moment.title}</p></div>
      {moment.viewerState.liked ? <span className="rounded-full bg-rose-50 p-1 text-rose-500" title="Te gusta"><Heart className="h-3.5 w-3.5 fill-rose-500" /></span> : null}
    </button>
  );
}
