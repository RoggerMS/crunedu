export function NotesFilters({ options, active, onChange }: { options: string[]; active: string; onChange: (value: string) => void }) {
  return <div className="flex gap-2 overflow-x-auto">{options.map((o)=><button key={o} onClick={()=>onChange(o)} className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${active===o?"bg-indigo-600 text-white":"bg-white border border-slate-200 text-slate-700"}`}>{o}</button>)}</div>;
}
