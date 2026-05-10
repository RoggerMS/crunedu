import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { DebateMode } from "./types";

export function DebatesHeader({ mode, stats, onCreate, onPropose }: { mode: DebateMode; stats: Array<{ label: string; value: string }>; onCreate: () => void; onPropose: () => void }) {
  const description = mode === "academicos" ? "Espacio para discutir temas de clase, ideas académicas y contenidos de cursos." : "Espacio para conversar sobre la vida universitaria, tecnología, opiniones, métodos de aprendizaje y temas de interés estudiantil.";
  return <Card className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-black text-slate-900">Debates</h1><p className="mt-1 text-sm text-slate-600">{description}</p></div><div className="flex flex-wrap gap-2"><PrimaryButton onClick={onCreate}>Crear debate</PrimaryButton><SecondaryButton onClick={onPropose}>Proponer tema semanal</SecondaryButton></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">{item.label}</p><p className="text-lg font-bold text-slate-900">{item.value}</p></div>)}</div></Card>;
}
