"use client";

import Link from "next/link";
import { Download, Bookmark, Share2, Flag, Pencil, Trash2 } from "lucide-react";
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
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      {/* Main content */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <Link href="/app/apuntes" className="text-sm font-semibold text-indigo-700">← Volver a Apuntes</Link>

        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{note.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{note.author.name}</span>
            {note.course ? <><span aria-hidden="true">•</span><span>{note.course}</span></> : null}
            {note.community ? <><span aria-hidden="true">•</span><span>{note.community.name}</span></> : null}
            <span aria-hidden="true">•</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DocumentFileIcon fileType={note.file.fileType} size="md" />
          {note.materialType ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{note.materialType}</span> : null}
          {note.cycle ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{note.cycle}</span> : null}
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">{note.visibility === "public" ? "Público" : note.visibility === "community" ? "Solo comunidad" : "Privado"}</span>
          {note.tags.map((tag) => <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600" key={tag}>#{tag}</span>)}
        </div>

        {note.description ? <p className="text-sm leading-relaxed text-slate-700">{note.description}</p> : null}

        <NoteFilePreview file={note.file} />

        {/* Action buttons with hierarchy */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" />
            Descargar ({formatSize(note.file.size)})
          </button>
          <button
            onClick={onSave}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${note.viewerState.saved ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            <Bookmark className="h-4 w-4" />
            {note.viewerState.saved ? "Guardado" : "Guardar"}
          </button>
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
          {note.viewerState.canReport ? (
            <button
              onClick={onReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Flag className="h-4 w-4" />
              Reportar
            </button>
          ) : null}
          {note.viewerState.canEdit && onEdit ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          ) : null}
          {note.viewerState.canDelete && onDelete ? (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          ) : null}
        </div>

        {/* Rating section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Valora este apunte</p>
              <p className="text-xs text-slate-500">{note.rating.count} {note.rating.count === 1 ? "valoración" : "valoraciones"} · promedio {note.rating.average.toFixed(1)} / 5</p>
            </div>
            <RatingControl value={note.rating.viewerRating} onRate={ratingBusy ? undefined : onRate} size="md" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-900">Estadísticas</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Descargas</span>
              <span className="font-semibold text-slate-900">{note.stats.downloads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Guardados</span>
              <span className="font-semibold text-slate-900">{note.stats.saves}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Vistas</span>
              <span className="font-semibold text-slate-900">{note.stats.views}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Valoración</span>
              <span className="font-semibold text-amber-600">{note.rating.average.toFixed(1)} ★</span>
            </div>
          </div>
        </div>

        {related.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-bold text-slate-900">Apuntes relacionados</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/app/apuntes/${item.id}`} className="block rounded-lg p-2 text-slate-700 hover:bg-slate-50">
                    <p className="font-medium text-slate-800">{item.title}</p>
                    {item.course ? <p className="text-xs text-slate-500">{item.course} · {item.rating.average.toFixed(1)} ★</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
