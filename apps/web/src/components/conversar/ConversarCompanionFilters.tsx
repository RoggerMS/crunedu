"use client";

type SelectOption = { value: string; label: string };

type ConversarCompanionFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  voiceFilter: string;
  onVoiceFilterChange: (value: string) => void;
  universityFilter: string;
  onUniversityFilterChange: (value: string) => void;
  helpTypeFilter: string;
  onHelpTypeFilterChange: (value: string) => void;
  levelFilter: string;
  onLevelFilterChange: (value: string) => void;
  helpTypeOptions: SelectOption[];
};

export function ConversarCompanionFilters({
  query,
  onQueryChange,
  voiceFilter,
  onVoiceFilterChange,
  universityFilter,
  onUniversityFilterChange,
  helpTypeFilter,
  onHelpTypeFilterChange,
  levelFilter,
  onLevelFilterChange,
  helpTypeOptions,
}: ConversarCompanionFiltersProps) {
  return (
    <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
      <label className="space-y-1 lg:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tema o curso</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar por tema, curso o estudiante..."
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-200 focus:ring"
        />
      </label>
      <SelectField label="Disponible ahora" value={voiceFilter} onChange={onVoiceFilterChange} options={[{ value: "all", label: "Todos" }, { value: "voice", label: "Disponible con voz" }, { value: "text", label: "Solo texto / no voz" }]} />
      <SelectField label="Universidad" value={universityFilter} onChange={onUniversityFilterChange} options={[{ value: "all", label: "Todas" }, { value: "cantuta", label: "La Cantuta" }, { value: "other", label: "Otra / no especificada" }]} />
      <SelectField label="Tipo de ayuda" value={helpTypeFilter} onChange={onHelpTypeFilterChange} options={helpTypeOptions} />
      <div className="sm:col-span-2 lg:col-span-5">
        <SelectField label="Nivel" value={levelFilter} onChange={onLevelFilterChange} options={[{ value: "all", label: "Todos" }, { value: "Básico", label: "Básico" }, { value: "Intermedio", label: "Intermedio" }, { value: "Avanzado", label: "Avanzado" }]} />
      </div>
    </article>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: SelectOption[] }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-200 focus:ring">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
