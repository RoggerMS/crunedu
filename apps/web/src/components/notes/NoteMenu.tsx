"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type NoteMenuOption = {
  key: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

export function NoteMenu({ options, disabled }: { options: NoteMenuOption[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!options.length) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        aria-label="Abrir opciones del apunte"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setOpen(false);
                option.onSelect();
              }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-slate-50 ${option.danger ? "text-rose-700" : "text-slate-700"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
