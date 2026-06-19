"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { NoteItem } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";
import { formatSize, NoteFilePreview } from "./NoteFilePreview";
import { NoteMenu, type NoteMenuOption } from "./NoteMenu";

type NoteCardProps = {
  note: NoteItem;
  onSave: () => void;
  onShare: () => void;
  onDownload: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function NoteCard({ note, onSave, onShare, onDownload, onReport, onEdit, onDelete }: NoteCardProps) {
  const createdAt = new Date(note.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", timeZone: "America/Lima" });
  const menuOptions: NoteMenuOption[] = [
    { key: "copy", label: "Copiar enlace", onSelect: onShare },
    ...(note.viewerState.canReport && onReport ? [{ key: "report", label: "Reportar apunte", onSelect: onReport }] : []),
    ...(note.viewerState.canEdit && onEdit ? [{ key: "edit", label: "Editar apunte", onSelect: onEdit }] : []),
    ...(note.viewerState.canDelete && onDelete ? [{ key: "delete", label: "Eliminar apunte", onSelect: onDelete, danger: true }] : []),
  ];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{note.author.name}{note.community ? ` · ${note.community.name}` : ""}</p>
          <p className="text-xs text-slate-400">{createdAt}</p>
          <h3 className="mt-1 text-sm font-bold text-slate-900">{note.title}</h3>
          {note.description ? <p className="line-clamp-2 text-xs text-slate-600">{note.description}</p> : null}
        </div>
        <NoteMenu options={menuOptions} />
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex flex-wrap gap-1">
            {note.course ? <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">{note.course}</span> : null}
            {note.materialType ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{note.materialType}</span> : null}
            {note.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">#{tag}</span>)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{note.rating.average.toFixed(1)} ({note.rating.count})</span>
            <span>{note.stats.downloads} descargas</span>
            <span>{note.stats.saves} guardados</span>
            <DocumentFileIcon fileType={note.file.fileType} />
            <span className="text-slate-400">{formatSize(note.file.size)}</span>
          </div>
        </div>
        <NoteFilePreview file={note.file} compact />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Link className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50" href={`/app/apuntes/${note.id}`}>Ver apunte</Link>
        <button type="button" onClick={onDownload} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Descargar</button>
        <button type="button" onClick={onSave} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">{note.viewerState.saved ? "Guardado" : "Guardar"}</button>
        <button type="button" onClick={onShare} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Compartir</button>
      </div>
    </article>
  );
}
