export function CommunityMembersCard({ count, creatorName }: { count: number; creatorName: string }) {
  return <aside className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Miembros</h3><button className="text-sm font-semibold text-indigo-700">Ver todos</button></div><p className="text-sm text-slate-600">{count} {count === 1 ? "miembro" : "miembros"}</p><ul className="mt-3 space-y-2 text-sm"><li className="rounded-lg bg-slate-50 px-3 py-2">{creatorName} (Creador)</li></ul></aside>;
}
