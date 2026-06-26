import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { MomentMediaFallback } from "./MomentMediaFallback";
import { buildMomentMediaUrl } from "@/lib/moments-api";
import type { MomentItem } from "./types";

export function MomentMediaPanel({ moment, previousMoment, nextMoment }: { moment: MomentItem; previousMoment: () => void; nextMoment: () => void }) {
  const media = moment.media[0];
  const mediaSrc = media ? buildMomentMediaUrl(media.url) : null;
  const canRender = Boolean(mediaSrc);

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-3xl md:min-h-[520px] md:h-[58vh] md:max-h-[680px]">
      {canRender && mediaSrc ? (
        <img src={mediaSrc} alt={media?.alt ?? moment.title} className="h-full w-full rounded-3xl object-cover" />
      ) : (
        <MomentMediaFallback momentType={moment.type} title={moment.title} />
      )}
      {media?.type === "video" ? <span className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white backdrop-blur"><PlayCircle className="h-5 w-5" /></span> : null}
      <button onClick={previousMoment} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
      <button onClick={nextMoment} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
      {moment.media.length > 1 ? <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur">{moment.media.map((item, index) => <span key={item.id} className={`h-2 w-2 rounded-full ${index === 0 ? "bg-white" : "bg-white/50"}`} />)}</div> : null}
    </div>
  );
}
