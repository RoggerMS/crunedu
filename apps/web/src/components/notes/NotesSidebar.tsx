"use client";

import type { NoteItem } from "./types";
import type { NoteContributor } from "@/lib/api-helpers";

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
          featured.map((n) => (
            <button key={n.id} className="mt-2 block text-left text-sm font-medium text-indigo-700 hover:underline" onClick={() => onNoteClick(n.id)}>
              {n.title} — {n.rating.average.toFixed(1)} ★
            </button>
          ))
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
