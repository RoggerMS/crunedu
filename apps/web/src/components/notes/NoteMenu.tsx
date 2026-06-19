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
  const [focusIndex, setFocusIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) setFocusIndex(-1);
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter" && focusIndex >= 0) {
      event.preventDefault();
      const option = options[focusIndex];
      if (option) {
        setOpen(false);
        option.onSelect();
      }
    }
  }

  if (!options.length) return null;

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir opciones del apunte"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg" role="menu">
          {options.map((option, index) => (
            <button
              key={option.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                option.onSelect();
              }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-slate-50 ${option.danger ? "text-rose-700" : "text-slate-700"} ${focusIndex === index ? "bg-slate-50 outline-none" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
