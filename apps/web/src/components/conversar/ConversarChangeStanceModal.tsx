import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const options = ["A favor", "En contra", "Depende del uso", "Proponer otra postura"];

export function ConversarChangeStanceModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState(options[0]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">Cambiar postura</h3>
        <p className="mt-2 text-sm text-slate-600">Elige la postura que representa mejor tu opinión actual.</p>
        <div className="mt-4 space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm text-slate-700">
              <input type="radio" name="stance" checked={selected === option} onChange={() => setSelected(option)} />
              {option}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Guardar cambio</button>
        </div>
      </div>
    </div>
  );
}
