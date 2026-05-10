import type { QuestionFile, QuestionImage } from "./types";

export function QuestionAttachmentPreview({ images, files }: { images?: QuestionImage[]; files?: QuestionFile[] }) {
  return <div className="space-y-2">{images?.[0] ? <div className="relative h-20 w-28 overflow-hidden rounded-lg"><img src={images[0].url} alt={images[0].alt ?? "Adjunto"} className="h-full w-full object-cover" loading="lazy" />{images.length > 1 ? <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-xs text-white">+{images.length - 1}</span> : null}</div> : null}{files?.map((f) => <div key={f.id} className="rounded-lg border border-slate-200 p-2 text-xs"><p className="truncate font-semibold">{f.name}</p><p className="text-slate-500">{f.type.split("/").pop()?.toUpperCase()} · {Math.round(f.size / 1024)} KB</p></div>)}</div>;
}
