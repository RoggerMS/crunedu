import { BookOpen, Download, GraduationCap, Layers3 } from "lucide-react";

export function NotesHeader({ onOpenModal, stats, onMine, onSaved }: { onOpenModal: () => void; onMine: () => void; onSaved: () => void; stats: { shared: number; downloads: number; students: number; courses: number } }) {
  const statCards = [
    { label: "apuntes compartidos", value: stats.shared.toLocaleString(), icon: BookOpen },
    { label: "descargas esta semana", value: stats.downloads.toLocaleString(), icon: Download },
    { label: "estudiantes usando materiales", value: stats.students.toLocaleString(), icon: GraduationCap },
    { label: "cursos con apuntes", value: stats.courses.toLocaleString(), icon: Layers3 },
  ];

  return <div className="rounded-3xl border border-slate-200 bg-white p-4"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]"><div><h1 className="text-2xl font-bold">Apuntes</h1><p className="mt-1 text-sm text-slate-600">Encuentra y comparte materiales de estudio, resúmenes, ejercicios y recursos académicos.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={onOpenModal} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Subir apunte</button><button onClick={onMine} className="rounded-xl border px-3 py-2 text-sm">Mis apuntes</button><button onClick={onSaved} className="rounded-xl border px-3 py-2 text-sm">Guardados</button></div></div><div className="grid grid-cols-2 gap-2">{statCards.map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-slate-200 p-3"><Icon className="h-4 w-4 text-indigo-600" /><p className="mt-1 text-xl font-bold leading-none">{item.value}</p><p className="mt-1 text-[11px] text-slate-500">{item.label}</p></div>; })}</div></div></div>;
}
