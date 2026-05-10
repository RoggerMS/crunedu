import { Select } from "@/components/ui";
import type { CommunityFilter, CommunitySort } from "./types";

const FILTERS: { key: CommunityFilter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "mis-comunidades", label: "Mis comunidades" },
  { key: "carreras", label: "Carreras" },
  { key: "cursos", label: "Cursos" },
  { key: "tramites", label: "Trámites" },
  { key: "debates", label: "Debates" },
  { key: "mas-activas", label: "Más activas" },
  { key: "nuevas", label: "Nuevas" },
];

export function CommunityFilters({ activeFilter, onFilterChange, sort, onSortChange }: { activeFilter: CommunityFilter; onFilterChange: (filter: CommunityFilter) => void; sort: CommunitySort; onSortChange: (sort: CommunitySort) => void; }) {
  return <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 overflow-x-auto pb-1">{FILTERS.map((filter) => <button key={filter.key} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${activeFilter === filter.key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`} onClick={() => onFilterChange(filter.key)}>{filter.label}</button>)}</div><Select className="w-full sm:max-w-[180px]" value={sort} onChange={(e) => onSortChange(e.target.value as CommunitySort)}><option value="mas-recientes">Más recientes</option><option value="mas-antiguas">Más antiguas</option></Select></div>;
}
