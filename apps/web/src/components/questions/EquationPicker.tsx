"use client";

import { useEffect, useRef } from "react";

type EquationTemplate = {
  label: string;
  insert: string;
  hint: string;
};

const TEMPLATES: EquationTemplate[] = [
  { label: "x²", insert: "x²", hint: "Cuadrado" },
  { label: "x³", insert: "x³", hint: "Cubo" },
  { label: "xₙ", insert: "xₙ", hint: "Subíndice" },
  { label: "√x", insert: "√()", hint: "Raíz cuadrada" },
  { label: "∛x", insert: "∛()", hint: "Raíz cúbica" },
  { label: "a/b", insert: "()/()", hint: "Fracción" },
  { label: "≤", insert: "≤", hint: "Menor o igual" },
  { label: "≥", insert: "≥", hint: "Mayor o igual" },
  { label: "≠", insert: "≠", hint: "Diferente" },
  { label: "±", insert: "±", hint: "Más/menos" },
  { label: "π", insert: "π", hint: "Pi" },
  { label: "α", insert: "α", hint: "Alfa" },
  { label: "β", insert: "β", hint: "Beta" },
  { label: "Δ", insert: "Δ", hint: "Delta" },
  { label: "θ", insert: "θ", hint: "Theta" },
  { label: "∑", insert: "∑() = ", hint: "Sumatoria" },
  { label: "∫", insert: "∫() d", hint: "Integral" },
  { label: "lim", insert: "lim →()", hint: "Límite" },
  { label: "log", insert: "log() = ", hint: "Logaritmo" },
  { label: "ln", insert: "ln() = ", hint: "Logaritmo natural" },
  { label: "→", insert: "→", hint: "Implica / tiende a" },
  { label: "∞", insert: "∞", hint: "Infinito" },
];

type EquationPickerProps = {
  open: boolean;
  onInsert: (text: string) => void;
  onClose: () => void;
};

export function EquationPicker({ open, onInsert, onClose }: EquationPickerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:w-80"
      role="dialog"
      aria-label="Ecuaciones frecuentes"
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Insertar ecuación</h4>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100" aria-label="Cerrar ecuaciones">Cerrar</button>
      </div>
      <p className="mb-2 text-xs text-slate-500">Elige una estructura y reemplaza los paréntesis con tus valores.</p>
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
        {TEMPLATES.map((template) => (
          <button
            key={template.label}
            type="button"
            title={template.hint}
            onClick={() => onInsert(template.insert)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold text-slate-800 hover:border-indigo-400 hover:bg-indigo-50"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}
