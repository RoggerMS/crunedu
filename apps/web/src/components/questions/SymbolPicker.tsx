"use client";

import { useEffect, useRef } from "react";

type SymbolCategory = {
  label: string;
  symbols: string[];
};

const CATEGORIES: SymbolCategory[] = [
  {
    label: "Potencias y raíces",
    symbols: ["²", "³", "√", "∛", "⁴", "⁵", "ⁿ", "₁", "₂", "₃", "ₙ"],
  },
  {
    label: "Operaciones",
    symbols: ["×", "÷", "±", "∓", "·", "∗", "∞"],
  },
  {
    label: "Relaciones",
    symbols: ["≠", "≈", "≤", "≥", "≡", "∝"],
  },
  {
    label: "Flechas y lógica",
    symbols: ["→", "←", "↔", "⇒", "⇔", "↑", "↓", "∧", "∨", "¬", "∀", "∃"],
  },
  {
    label: "Conjuntos",
    symbols: ["∈", "∉", "⊂", "⊆", "⊃", "∪", "∩", "∅", "ℕ", "ℤ", "ℚ", "ℝ", "ℂ"],
  },
  {
    label: "Griegas",
    symbols: ["α", "β", "γ", "δ", "Δ", "ε", "θ", "λ", "μ", "π", "ρ", "σ", "Σ", "τ", "φ", "Φ", "ψ", "Ψ", "ω", "Ω"],
  },
  {
    label: "Cálculo",
    symbols: ["∫", "∑", "∏", "∂", "∇", "lim", "log", "ln", "exp"],
  },
  {
    label: "Geometría y unidades",
    symbols: ["°", "′", "″", "∠", "⊥", "∥", "△", "○", "≅", "∼"],
  },
];

type SymbolPickerProps = {
  open: boolean;
  onInsert: (symbol: string) => void;
  onClose: () => void;
};

export function SymbolPicker({ open, onInsert, onClose }: SymbolPickerProps) {
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
      className="absolute z-30 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:w-80"
      role="dialog"
      aria-label="Símbolos matemáticos"
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Insertar símbolo</h4>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100" aria-label="Cerrar símbolos">Cerrar</button>
      </div>
      <div className="space-y-3">
        {CATEGORIES.map((category) => (
          <div key={category.label}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{category.label}</p>
            <div className="flex flex-wrap gap-1">
              {category.symbols.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => onInsert(symbol)}
                  className="h-9 min-w-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-800 hover:border-indigo-400 hover:bg-indigo-50"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
