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

export function ConversarFilters({
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
}: ConversarFiltersProps) {
  return (
    <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 xl:grid-cols-5">
      <Input
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder="Buscar por tema o palabra clave..."
      />
      <Select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
        <option value="all">Curso/Tema</option>
        <option value="Matemática">Matemática</option>
        <option value="Historia">Historia</option>
        <option value="Vida universitaria">Vida universitaria</option>
        <option value="Tecnología / Educación">Tecnología / Educación</option>
        <option value="Inglés">Inglés</option>
        <option value="Física">Física</option>
        <option value="Programación">Programación</option>
        <option value="Filosofía">Filosofía</option>
      </Select>
      <Select value={type} onChange={(event) => onTypeChange(event.target.value as ConversationType | "all")}>
        <option value="all">Tipo</option>
        <option value="open">Conversación abierta</option>
        <option value="study">Sala de estudio</option>
        <option value="question">Pregunta para conversar</option>
        <option value="debate">Debate formal</option>
      </Select>
      <Select value={status} onChange={(event) => onStatusChange(event.target.value as ConversationStatus | "all")}>
        <option value="all">Estado</option>
        <option value="live">En vivo</option>
        <option value="waiting">En espera</option>
        <option value="finished">Finalizada</option>
        <option value="recorded">Grabada</option>
      </Select>
      <Select value={sort} onChange={(event) => onSortChange(event.target.value as "latest" | "active" | "plays")}>
        <option value="latest">Más recientes</option>
        <option value="active">Más activos</option>
        <option value="plays">Más escuchados</option>
      </Select>
    </div>
  );
}
