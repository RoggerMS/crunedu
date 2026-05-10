export type FeedFilter = "para-ti" | "siguiendo" | "todas" | "recientes";

export function FeedFilters({ active, onChange }: { active: FeedFilter; onChange: (filter: FeedFilter) => void }) {
  const filters: Array<{ id: FeedFilter; label: string }> = [
    { id: "para-ti", label: "Para ti" },
    { id: "siguiendo", label: "Siguiendo" },
    { id: "todas", label: "Todas las comunidades" },
    { id: "recientes", label: "Más recientes" },
  ];
  return <div className="flex flex-wrap gap-2">{filters.map((filter) => <button key={filter.id} onClick={() => onChange(filter.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${active === filter.id ? "bg-indigo-100 text-indigo-700" : "border border-slate-200 text-slate-600"}`}>{filter.label}</button>)}</div>;
}
