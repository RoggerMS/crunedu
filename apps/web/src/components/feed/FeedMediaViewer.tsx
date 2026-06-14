import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

type MediaItem = { id: string; type: "image" | "video"; previewUrl?: string; alt?: string };

export function FeedMediaViewer({ open, media, index, onClose, onPrev, onNext }: { open: boolean; media: MediaItem[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onNext, onPrev]);

  if (!open || !media.length) return null;
  const current = media[index];

  return <div className="fixed inset-0 z-[70] bg-black/85 p-3" onClick={onClose}>
    <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
      <button className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25" onClick={onClose}><X size={18} /></button>
      {media.length > 1 ? <button className="absolute left-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25" onClick={onPrev}><ChevronLeft size={20} /></button> : null}
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950">
        {!current?.previewUrl ? <div className="flex h-[55vh] items-center justify-center text-sm text-slate-300">Multimedia no disponible localmente.</div> : current.type === "video" ? <video src={current.previewUrl} controls className="max-h-[75vh] w-full" /> : <img src={current.previewUrl} alt={current.alt ?? "Multimedia"} width={1400} height={900} className="max-h-[75vh] w-full object-contain" />}
        <div className="px-4 py-2 text-center text-xs text-slate-200">{index + 1} de {media.length}</div>
      </div>
      {media.length > 1 ? <button className="absolute right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25" onClick={onNext}><ChevronRight size={20} /></button> : null}
    </div>
  </div>;
}
