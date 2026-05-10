const baseClass = "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition";

export function NotesFilters({ rows, onChange }: { rows: Array<{ key: string; options: string[]; active: string }>; onChange: (key: string, value: string) => void }) {
  return <div className="space-y-2 rounded-2xl border bg-white p-3">{rows.map((row) => <div key={row.key} className="flex gap-2 overflow-x-auto pb-1">{row.options.map((option) => <button key={option} onClick={() => onChange(row.key, option)} className={`${baseClass} ${row.active === option ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>{option}</button>)}</div>)}</div>;
}
