"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { MouseEvent } from "react";
import type { NoteItem } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";
import { formatSize } from "./NoteFilePreview";
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

function stopCardNavigation(event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function NoteCard({ note, onSave, onShare, onDownload, onReport, onEdit, onDelete }: NoteCardProps) {
  const createdAt = new Date(note.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", timeZone: "America/Lima" });
  const menuOptions: NoteMenuOption[] = [
    { key: "copy", label: "Copiar enlace", onSelect: onShare },
    ...(note.viewerState.canReport && onReport ? [{ key: "report", label: "Reportar apunte", onSelect: onReport }] : []),
    ...(note.viewerState.canEdit && onEdit ? [{ key: "edit", label: "Editar apunte", onSelect: onEdit }] : []),
    ...(note.viewerState.canDelete && onDelete ? [{ key: "delete", label: "Eliminar apunte", onSelect: onDelete, danger: true }] : []),
  ];

  return (
    <Link href={`/app/apuntes/${note.id}`} className="block">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{note.author.name}</span>
              {note.community ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{note.community.name}</span>
                </>
              ) : null}
              <span aria-hidden="true">•</span>
              <span>{createdAt}</span>
            </div>
            <h3 className="mt-2 font-bold text-slate-900">{note.title}</h3>
            {note.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{note.description}</p> : null}
          </div>
          <div onClick={(event) => stopCardNavigation(event as any)} onKeyDown={(event) => event.stopPropagation()}>
            <NoteMenu options={menuOptions} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {note.course ? <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{note.course}</span> : null}
          {note.materialType ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{note.materialType}</span> : null}
          {note.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">#{tag}</span>)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{note.rating.average.toFixed(1)} ({note.rating.count})</span>
          <span>{note.stats.downloads} descargas</span>
          <span>{note.stats.saves} guardados</span>
          <DocumentFileIcon fileType={note.file.fileType} />
          <span className="text-slate-400">{formatSize(note.file.size)}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(event) => stopCardNavigation(event as any)} onKeyDown={(event) => event.stopPropagation()}>
          <span className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Ver apunte</span>
          <button type="button" onClick={onDownload} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Descargar</button>
          <button type="button" onClick={onSave} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${note.viewerState.saved ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{note.viewerState.saved ? "Guardado" : "Guardar"}</button>
          <button type="button" onClick={onShare} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Compartir</button>
        </div>
      </article>
    </Link>
  );
}
