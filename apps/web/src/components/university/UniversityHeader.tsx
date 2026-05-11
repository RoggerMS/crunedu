import { Building2, Bookmark, CalendarDays } from "lucide-react";

export function UniversityHeader({ onSuggest, onCalendar, onSaved }: { onSuggest: () => void; onCalendar: () => void; onSaved: () => void }) {
  return <div className="rounded-2xl border bg-white p-6"><Building2 className="h-10 w-10 text-indigo-600" /><h1 className="mt-3 text-2xl font-black">Universidad</h1><p className="mt-1 text-sm text-slate-600">Todo sobre trámites, fechas, convocatorias, eventos y servicios universitarios.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={onSuggest} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Sugerir información</button><button onClick={onCalendar} className="rounded-lg border px-3 py-2 text-sm"><CalendarDays className="mr-1 inline h-4 w-4" />Calendario</button><button onClick={onSaved} className="rounded-lg border px-3 py-2 text-sm"><Bookmark className="mr-1 inline h-4 w-4" />Guardados</button></div></div>;
}
