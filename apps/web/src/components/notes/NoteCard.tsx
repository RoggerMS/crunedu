import Link from "next/link";
import { MoreHorizontal, Star } from "lucide-react";
import { NoteFilePreview } from "./NoteFilePreview";
import { RatingControl } from "./RatingControl";
import type { NoteItem } from "./types";

type NoteCardProps = {
  note: NoteItem;
  onSave: () => void;
  onShare: () => void;
  onDownload: () => void;
  onRate: (rating: number) => void;
  onMenu: () => void;
};

export function NoteCard({ note, onSave, onShare, onDownload, onRate, onMenu }: NoteCardProps) {
  const createdAt = new Date(note.createdAt).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    timeZone: "America/Lima",
  });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">{note.authorName} · {note.course}</p>
          <p className="text-xs text-slate-400">{createdAt}</p>
          <h3 className="mt-1 text-sm font-bold">{note.title}</h3>
          <p className="line-clamp-2 text-xs text-slate-600">{note.description}</p>
        </div>
        <button type="button" onClick={onMenu} className="rounded-lg border p-1" aria-label="Abrir opciones del apunte"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_210px]">
        <div>
          <div className="flex flex-wrap gap-1">{note.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">#{tag}</span>)}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">{note.status.replaceAll("_", " ")}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{note.rating.average.toFixed(1)} / 5.0</span>
            <span>{note.stats.downloads} descargas</span><span>{note.stats.saves} guardados</span><span>{note.stats.comments} comentarios</span>
          </div>
        </div>
        <NoteFilePreview file={note.file} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Link className="rounded-lg border px-2.5 py-1 text-xs" href={`/app/apuntes/${note.id}`}>Ver apunte</Link>
        <button type="button" onClick={onDownload} className="rounded-lg border px-2.5 py-1 text-xs">Descargar</button>
        <button type="button" onClick={onSave} className="rounded-lg border px-2.5 py-1 text-xs">{note.viewerState.saved ? "Guardado" : "Guardar"}</button>
        <button type="button" onClick={onShare} className="rounded-lg border px-2.5 py-1 text-xs">Compartir</button>
        <RatingControl value={note.rating.viewerRating} onRate={onRate} />
      </div>
    </article>
  );
}
