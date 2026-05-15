"use client";

type SelectOption = { value: string; label: string };

type Props = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  topic: string;
  onTopicChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  topicOptions: SelectOption[];
};

export function ConversarRecordingsFilters(props: Props) {
  const {
    searchTerm,
    onSearchTermChange,
    topic,
    onTopicChange,
    type,
    onTypeChange,
    duration,
    onDurationChange,
    date,
    onDateChange,
    sort,
    onSortChange,
    topicOptions,
  } = props;
  return (
    <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-6">
      <input
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Buscar grabación"
        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2"
      />
      <SelectFilter
        label="Curso/Tema"
        value={topic}
        onChange={onTopicChange}
        options={[{ value: "all", label: "Todos" }, ...topicOptions]}
      />
      <SelectFilter
        label="Tipo"
        value={type}
        onChange={onTypeChange}
        options={[
          { value: "all", label: "Todos" },
          { value: "open", label: "Conversación abierta" },
          { value: "study", label: "Sala de estudio" },
          { value: "question", label: "Pregunta para conversar" },
          { value: "debate", label: "Debate formal" },
        ]}
      />
      <SelectFilter
        label="Duración"
        value={duration}
        onChange={onDurationChange}
        options={[
          { value: "all", label: "Todas" },
          { value: "20", label: "20+ min" },
          { value: "30", label: "30+ min" },
          { value: "40", label: "40+ min" },
        ]}
      />
      <SelectFilter
        label="Fecha"
        value={date}
        onChange={onDateChange}
        options={[
          { value: "all", label: "Todas" },
          { value: "7d", label: "Últimos 7 días" },
          { value: "30d", label: "Últimos 30 días" },
        ]}
      />
      <SelectFilter
        label="Ordenar"
        value={sort}
        onChange={onSortChange}
        options={[
          { value: "latest", label: "Más recientes" },
          { value: "plays", label: "Más escuchadas" },
          { value: "duration", label: "Mayor duración" },
        ]}
      />
    </article>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <label className="space-y-1 text-xs font-semibold text-slate-500">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none ring-indigo-500 focus:ring-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
