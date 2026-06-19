export function CommunityRulesCard({ rules }: { rules: string[] }) {
  const hasRules = rules.length > 0;
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Reglas de la comunidad</h3>
      {hasRules ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          {rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Esta comunidad aún no tiene reglas publicadas.</p>
      )}
    </aside>
  );
}
