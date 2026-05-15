import { Input, Select } from "@/components/ui";

export function ConversarFilters() {
  return (
    <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-2 xl:grid-cols-5">
      <Input placeholder="Buscar por tema o palabra clave..." />
      <Select defaultValue="all">
        <option value="all">Curso/Tema</option>
      </Select>
      <Select defaultValue="all">
        <option value="all">Tipo</option>
      </Select>
      <Select defaultValue="all">
        <option value="all">Estado</option>
      </Select>
      <Select defaultValue="latest">
        <option value="latest">Ordenar</option>
      </Select>
    </div>
  );
}
