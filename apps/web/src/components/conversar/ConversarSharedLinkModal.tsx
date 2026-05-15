import { useState } from "react";
interface Props {
  open: boolean;
  onClose: () => void;
}
export function ConversarSharedLinkModal({ open, onClose }: Props) {
  const [value, setValue] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">Compartir enlace</h3>
        <p className="mt-2 text-sm text-slate-600">
          Pega un enlace de apoyo para la conversación: Meet, Zoom, Discord,
          documento, pizarra, video o recurso externo.
        </p>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://..."
          className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
