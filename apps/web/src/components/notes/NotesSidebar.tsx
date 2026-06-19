"use client";

import { Star } from "lucide-react";
import type { NoteItem } from "./types";
import type { NoteContributor } from "@/lib/api-helpers";
import { DocumentFileIcon } from "./DocumentFileIcon";

type NotesSidebarProps = {
  notes: NoteItem[];
  onNoteClick: (id: string) => void;
  contributors: NoteContributor[];
};

export function NotesSidebar({ notes, onNoteClick, contributors }: NotesSidebarProps) {
  const featured = [...notes].sort((a, b) => b.rating.average - a.rating.average).slice(0, 3);
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">Cómo compartir un buen apunte</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-600">
          <li>Sube material propio o con permiso del autor.</li>
          <li>Añade una descripción clara y etiquetas.</li>
          <li>Verifica que el contenido sea legible.</li>
          <li>Usa ejemplos o resúmenes para ayudar.</li>
          <li>Respeta las normas de la comunidad.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">Apuntes destacados</h3>
        {featured.length ? (
          <div className="mt-3 space-y-2">
            {featured.map((n) => (
              <button key={n.id} className="flex w-full items-center gap-2 rounded-lg border border-slate-100 p-2 text-left transition hover:border-indigo-200 hover:bg-slate-50" onClick={() => onNoteClick(n.id)}>
                <DocumentFileIcon fileType={n.file.fileType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{n.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Star className="h-3 w-3 text-amber-500" />
                    {n.rating.average.toFixed(1)} · {n.stats.downloads} descargas
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aún no hay apuntes destacados.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-slate-900">Top colaboradores</h3>
        <p className="mt-1 text-xs text-slate-500">Por apuntes públicos compartidos.</p>
        {contributors.length ? (
          <ol className="mt-3 space-y-2">
            {contributors.map((collaborator, index) => (
              <li key={collaborator.userId} className="flex items-center gap-3 text-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{collaborator.name}</span>
                <span className="text-xs font-semibold text-emerald-600">{collaborator.publicNotes} apuntes</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aún no hay colaboradores. ¡Comparte un apunte y aparece aquí!</p>
        )}
      </div>
    </aside>
  );
}
