const FILTERS = ["Todas", "Sin responder", "Respondidas", "Resueltas", "Mis preguntas", "Más recientes"];

export function QuestionFilters({ active, onChange, course, onCourseChange, courses }: { active: string; onChange: (v: string) => void; course: string; onCourseChange: (v: string) => void; courses: string[] }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => onChange(f)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition ${active === f ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{f}</button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Todos", ...courses].map((c) => (
          <button key={c} onClick={() => onCourseChange(c)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${course === c ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{c}</button>
        ))}
      </div>
    </div>
  );
}
