"use client";

type QuestionsHeaderProps = {
  onAsk: () => void;
  onUnanswered: () => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function QuestionsHeader({ onAsk, onUnanswered, search, onSearchChange }: QuestionsHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Preguntas</h1>
          <p className="mt-1 max-w-xl text-slate-600">¿Qué quieres aprender? Comparte tu duda con la comunidad y recibe ayuda con explicaciones claras.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onAsk} className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700">Hacer una pregunta</button>
          <button onClick={onUnanswered} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Sin responder</button>
        </div>
      </div>
      <div className="mt-4">
        <label className="sr-only" htmlFor="questions-search">Buscar preguntas</label>
        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>
          <input
            id="questions-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Busca por tema, enunciado o palabra clave..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>
    </div>
  );
}
