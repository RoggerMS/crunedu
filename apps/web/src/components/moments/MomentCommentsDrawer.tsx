"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { MomentComment } from "./types";

export function MomentCommentsDrawer({
  open,
  onClose,
  comments,
  loading,
  onComment,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  comments: MomentComment[];
  loading?: boolean;
  onComment: (text: string) => void;
  onDelete?: (commentId: string) => void;
}) {
  const [text, setText] = useState("");
  if (!open) return null;

  function submit() {
    if (text.trim()) {
      onComment(text.trim());
      setText("");
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose}>
      <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Comentarios</h3>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Cerrar</button>
        </div>

        <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando comentarios...</div>
          ) : comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Aún no hay comentarios. ¡Sé el primero!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-100 p-2 text-sm">
                <div className="min-w-0">
                  <b className="text-slate-800">{c.author}: </b>
                  <span className="text-slate-700">{c.content}</span>
                </div>
                {c.isMine && onDelete ? (
                  <button onClick={() => onDelete(c.id)} aria-label="Eliminar comentario" className="shrink-0 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            className="flex-1 rounded-xl border border-slate-300 p-2 text-sm"
            placeholder="Escribe un comentario"
            maxLength={1000}
          />
          <button onClick={submit} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Publicar</button>
        </div>
      </div>
    </div>
  );
}
