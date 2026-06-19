"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ActionMenuItem = {
  key: string;
  label: string;
  icon?: React.ElementType;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  ariaLabel: string;
  align?: "left" | "right";
  triggerClassName?: string;
};

export function ActionMenu({ items, ariaLabel, align = "right", triggerClassName = "" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${triggerClassName}`}
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-[80] mt-2 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5 ${align === "right" ? "right-0" : "left-0"}`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect();
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700"
                }`}
              >
                {Icon ? <Icon size={16} className={item.danger ? "text-rose-600" : "text-slate-500"} /> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
