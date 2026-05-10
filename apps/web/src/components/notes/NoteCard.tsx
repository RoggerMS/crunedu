import Link from "next/link";
import { NoteFilePreview } from "./NoteFilePreview";
import { RatingControl } from "./RatingControl";
import type { NoteItem } from "./types";

export function NoteCard({ note, onSave, onShare, onDownload, onRate }: { note: NoteItem; onSave: () => void; onShare: () => void; onDownload: () => void; onRate: (n: number) => void }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{note.title}</p><p className="text-xs text-slate-500">{note.authorName} · {note.course}</p><p className="mt-1 text-sm text-slate-600">{note.description}</p></div><div className="w-48"><NoteFilePreview file={note.file} /></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs">{note.tags.map((t)=><span key={t} className="rounded-full bg-slate-100 px-2 py-1">#{t}</span>)}</div><div className="mt-3 flex flex-wrap items-center gap-2"><Link className="rounded-xl border px-3 py-1 text-xs" href={`/app/apuntes/${note.id}`}>Ver apunte</Link><button onClick={onDownload} className="rounded-xl border px-3 py-1 text-xs">Descargar</button><button onClick={onSave} className="rounded-xl border px-3 py-1 text-xs">{note.viewerState.saved ? "Guardado" : "Guardar"}</button><button onClick={onShare} className="rounded-xl border px-3 py-1 text-xs">Compartir</button><RatingControl value={note.rating.viewerRating} onRate={onRate} /></div></article>;
}
