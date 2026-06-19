"use client";

type NotesHeaderProps = {
  onOpenModal: () => void;
  onMine: () => void;
  onSaved: () => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function NotesHeader({ onOpenModal, onMine, onSaved, search, onSearchChange }: NotesHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apuntes</h1>
          <p className="mt-1 text-sm text-slate-600">Comparte y encuentra material útil para estudiar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpenModal} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Subir apunte</button>
          <button onClick={onMine} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Mis apuntes</button>
          <button onClick={onSaved} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Guardados</button>
        </div>
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar apuntes por título, curso o descripción"
        className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
