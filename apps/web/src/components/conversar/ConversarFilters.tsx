import { Input, Select } from "@/components/ui";
import type { ConversationStatus, ConversationType } from "@/modules/conversar/types";

interface ConversarFiltersProps {
  searchTerm: string;
  category: string;
  type: ConversationType | "all";
  status: ConversationStatus | "all";
  sort: "latest" | "active" | "plays";
  onSearchTermChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTypeChange: (value: ConversationType | "all") => void;
  onStatusChange: (value: ConversationStatus | "all") => void;
  onSortChange: (value: "latest" | "active" | "plays") => void;
}

export function ConversarFilters(props: ConversarFiltersProps) {
  const {
    searchTerm,
    category,
    type,
    status,
    sort,
    onSearchTermChange,
    onCategoryChange,
    onTypeChange,
    onStatusChange,
    onSortChange,
  } = props;

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Búsqueda y filtros académicos
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Tema o palabra clave</span>
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Ej. cálculo, historia, redacción"
            className="border-slate-200 bg-slate-50/70"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Curso o tema</span>
          <Select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="border-slate-200 bg-slate-50/70"
          >
            <option value="all">Todos</option>
            <option value="Matemática">Matemática</option>
            <option value="Historia">Historia</option>
            <option value="Vida universitaria">Vida universitaria</option>
            <option value="Tecnología / Educación">Tecnología / Educación</option>
            <option value="Inglés">Inglés</option>
            <option value="Física">Física</option>
            <option value="Programación">Programación</option>
            <option value="Filosofía">Filosofía</option>
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Formato</span>
          <Select
            value={type}
            onChange={(event) => onTypeChange(event.target.value as ConversationType | "all")}
            className="border-slate-200 bg-slate-50/70"
          >
            <option value="all">Todos</option>
            <option value="open">Conversación abierta</option>
            <option value="study">Sala de estudio</option>
            <option value="question">Pregunta para conversar</option>
            <option value="debate">Debate formal</option>
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Estado</span>
          <Select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as ConversationStatus | "all")}
            className="border-slate-200 bg-slate-50/70"
          >
            <option value="all">Todos</option>
            <option value="live">En vivo</option>
            <option value="waiting">En espera</option>
            <option value="finished">Finalizada</option>
            <option value="recorded">Grabada</option>
          </Select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Ordenar por</span>
          <Select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as "latest" | "active" | "plays")}
            className="border-slate-200 bg-slate-50/70"
          >
            <option value="latest">Más recientes</option>
            <option value="active">Más activos</option>
            <option value="plays">Más escuchados</option>
          </Select>
        </label>
      </div>
    </section>
  );
}
