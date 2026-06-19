type Member = { id: number; name: string; avatarUrl?: string | null; isCreator?: boolean };

export function CommunityMembersCard({ count, members = [] }: { count: number; members?: Member[] }) {
  const list = members.slice(0, 4);
  const overflow = Math.max(count - list.length, 0);
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Miembros</h3>
      </div>
      <p className="text-sm text-slate-600">{count} {count === 1 ? "miembro" : "miembros"}</p>
      {list.length ? (
        <>
          <div className="mt-3 flex items-center gap-2">
            {list.map((member) => (
              <div key={member.id} className="h-9 w-9 overflow-hidden rounded-full bg-indigo-100 text-xs font-bold text-indigo-700" title={member.name}>
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">{member.name.charAt(0).toUpperCase() || "U"}</div>
                )}
              </div>
            ))}
            {overflow ? <span className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600">+{overflow}</span> : null}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {list.map((member) => (
              <li key={`row-${member.id}`} className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{member.name}</span>
                {member.isCreator ? <span className="text-xs font-semibold text-indigo-600">Creador</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-xs text-slate-500">La lista de miembros estará disponible cuando la comunidad tenga actividad real.</p>
      )}
    </aside>
  );
}
