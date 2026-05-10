type QuestionsHeaderProps = {
  onAsk: () => void;
  onUnanswered: () => void;
  stats: { active: number; answers: number; solved: number };
};

export function QuestionsHeader({ onAsk, onUnanswered, stats }: QuestionsHeaderProps) {
  return <div className="rounded-2xl border bg-white p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"><div><h1 className="text-3xl font-black">Preguntas</h1><p className="mt-1 text-slate-600">Comparte tus dudas académicas, ejercicios o tareas y recibe ayuda de otros estudiantes.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={onAsk} className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">Hacer pregunta</button><button onClick={onUnanswered} className="rounded-xl border px-4 py-2 font-semibold">Ver preguntas sin responder</button></div></div><div className="rounded-2xl border bg-slate-50 p-4"><div className="grid grid-cols-2 gap-3 text-sm"><Stat label="preguntas activas" value={stats.active} /><Stat label="respuestas" value={stats.answers} /><Stat label="preguntas resueltas" value={stats.solved} /><Stat label="estudiantes ayudando" value={Math.max(1, Math.round(stats.answers * 0.12))} /></div></div></div></div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div><p className="text-lg font-bold text-slate-900">{new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(value)}</p><p className="text-xs text-slate-600">{label}</p></div>;
}
