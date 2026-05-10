export function QuestionSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder="Buscar preguntas, cursos, ejercicios o temas..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" />;
}
