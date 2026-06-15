type QuestionsHeaderProps = {
  onAsk: () => void;
  onUnanswered: () => void;
};

export function QuestionsHeader({ onAsk, onUnanswered }: QuestionsHeaderProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5">
      <h1 className="text-3xl font-black">Preguntas</h1>
      <p className="mt-1 max-w-3xl text-slate-600">Comparte dudas académicas, ejercicios o tareas y recibe ayuda con explicaciones claras.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onAsk} className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">Hacer pregunta</button>
        <button onClick={onUnanswered} className="rounded-xl border px-4 py-2 font-semibold">Ver preguntas sin responder</button>
      </div>
    </div>
  );
}
