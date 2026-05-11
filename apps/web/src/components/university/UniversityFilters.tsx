const row1 = ["Todo", "Trámite", "Convocatoria", "Evento", "Servicio", "Guía", "Urgentes", "Oficiales"];
const row2 = ["Académico", "Administrativo", "Pagos", "Matrícula", "Becas", "Biblioteca", "Bienestar", "Bolsa de trabajo", "Cultura"];

export function UniversityFilters({ selected, onChange }: { selected: string; onChange: (filter: string) => void }) {
  const renderRow = (filters: string[]) => <div className="flex flex-wrap gap-2">{filters.map((filter) => <button key={filter} onClick={() => onChange(filter)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${selected === filter ? "border-indigo-600 bg-indigo-600 text-white" : "bg-white text-slate-700"}`}>{filter}</button>)}</div>;
  return <div className="space-y-2">{renderRow(row1)}{renderRow(row2)}</div>;
}
