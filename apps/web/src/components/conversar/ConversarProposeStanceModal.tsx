import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ConversarProposeStanceModal({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [approach, setApproach] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">Proponer nueva postura</h3>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Nombre de la postura</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ej. Depende del contexto"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="mt-4 block text-sm font-semibold text-slate-700">Explica brevemente tu enfoque</label>
        <textarea
          value={approach}
          onChange={(event) => setApproach(event.target.value)}
          className="mt-1 h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setApproach("");
              onClose();
            }}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Proponer postura
          </button>
        </div>
      </div>
    </div>
  );
}
