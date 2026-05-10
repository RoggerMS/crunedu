export function CommunityRulesCard({ rules }: { rules: string[] }) {
  return <aside className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-semibold">Reglas de la comunidad</h3><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">{rules.map((rule) => <li key={rule}>{rule}</li>)}</ol><button className="mt-3 text-sm font-semibold text-indigo-700">Ver todas las reglas</button></aside>;
}
