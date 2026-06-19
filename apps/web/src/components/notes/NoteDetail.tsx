"use client";

import Link from "next/link";
import type { NoteItem } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";
import { formatSize, NoteFilePreview } from "./NoteFilePreview";
import { RatingControl } from "./RatingControl";

type NoteDetailProps = {
  note: NoteItem;
  related: NoteItem[];
  onRate: (value: number) => void;
  onSave: () => void;
  onShare: () => void;
  onDownload: () => void;
  onReport: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  ratingBusy?: boolean;
};

export function NoteDetail({ note, related, onRate, onSave, onShare, onDownload, onReport, onDelete, onEdit, ratingBusy }: NoteDetailProps) {
  const createdAt = new Date(note.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Lima" });
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <Link href="/app/apuntes" className="text-sm font-semibold text-indigo-700">← Volver a Apuntes</Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{note.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {note.author.name}
          {note.course ? ` · ${note.course}` : ""}
          {note.community ? ` · ${note.community.name}` : ""}
          {" · "}{createdAt}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <DocumentFileIcon fileType={note.file.fileType} size="md" />
        {note.materialType ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{note.materialType}</span> : null}
        {note.cycle ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{note.cycle}</span> : null}
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">{note.visibility === "public" ? "Público" : note.visibility === "community" ? "Solo comunidad" : "Privado"}</span>
        {note.tags.map((tag) => <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600" key={tag}>#{tag}</span>)}
      </div>

      {note.description ? <p className="text-sm text-slate-700">{note.description}</p> : null}

      <NoteFilePreview file={note.file} />

      <div className="flex flex-wrap gap-2">
        <button onClick={onDownload} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Descargar ({formatSize(note.file.size)})</button>
        <button onClick={onSave} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{note.viewerState.saved ? "Guardado" : "Guardar"}</button>
        <button onClick={onShare} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Compartir</button>
        {note.viewerState.canReport ? <button onClick={onReport} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Reportar</button> : null}
        {note.viewerState.canEdit && onEdit ? <button onClick={onEdit} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Editar</button> : null}
        {note.viewerState.canDelete && onDelete ? <button onClick={onDelete} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50">Eliminar</button> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Valora este apunte</p>
            <p className="text-xs text-slate-500">{note.rating.count} {note.rating.count === 1 ? "valoración" : "valoraciones"} · promedio {note.rating.average.toFixed(1)} / 5</p>
          </div>
          <RatingControl value={note.rating.viewerRating} onRate={ratingBusy ? undefined : onRate} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>{note.stats.downloads} descargas</span>
          <span>{note.stats.saves} guardados</span>
          <span>{note.stats.views} vistas</span>
        </div>
      </div>

      {related.length ? (
        <div>
          <h3 className="font-semibold text-slate-900">Apuntes relacionados</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={`/app/apuntes/${item.id}`} className="text-indigo-700 hover:underline">{item.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
