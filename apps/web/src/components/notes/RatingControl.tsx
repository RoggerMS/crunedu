"use client";

import { useState } from "react";

export function RatingControl({ value, onRate, size = "md" }: { value?: number | null; onRate?: (value: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;
  const starClass = size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Valorar ${n} estrellas`}
          disabled={!onRate}
          onMouseEnter={() => onRate && setHover(n)}
          onClick={() => onRate?.(n)}
          className={`${starClass} ${n <= active ? "text-amber-500" : "text-slate-300"} ${onRate ? "cursor-pointer hover:text-amber-400" : "cursor-default"} disabled:cursor-default`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
