"use client";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recent", label: "Recientes" },
  { value: "most_saved", label: "Más guardados" },
  { value: "most_downloaded", label: "Más descargados" },
  { value: "best_rated", label: "Mejor valorados" },
];

const baseClass = "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition";

export function NotesFilters({ sort, onSort }: { sort: string; onSort: (value: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSort(option.value)}
            className={`${baseClass} ${sort === option.value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { SORT_OPTIONS as NOTE_SORT_OPTIONS };
