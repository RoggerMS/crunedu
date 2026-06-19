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
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Apuntes</h1>
          <p className="mt-1 max-w-xl text-slate-600">Comparte y encuentra material útil para estudiar. Sube tus apuntes y ayuda a la comunidad.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpenModal} className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700">Subir apunte</button>
          <button onClick={onMine} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Mis apuntes</button>
          <button onClick={onSaved} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Guardados</button>
        </div>
      </div>
      <div className="mt-4">
        <label className="sr-only" htmlFor="notes-search">Buscar apuntes</label>
        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>
          <input
            id="notes-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar apuntes por título, curso o descripción..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>
    </div>
  );
}
