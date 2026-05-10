import { NoteFilePreview } from "./NoteFilePreview";
import { RatingControl } from "./RatingControl";
import type { NoteItem } from "./types";

export function NoteDetail({ note, onRate }: { note: NoteItem; onRate: (n: number) => void }) {
  return <div className="space-y-4 rounded-2xl border bg-white p-5"><h1 className="text-2xl font-bold">{note.title}</h1><p className="text-sm text-slate-500">{note.authorName} · {note.course}</p><p className="text-sm">{note.description}</p><NoteFilePreview file={note.file} /><div className="flex items-center gap-3"><span className="text-sm">{note.rating.average.toFixed(1)} / 5.0</span><RatingControl value={note.rating.viewerRating} onRate={onRate} /></div></div>;
}
