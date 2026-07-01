import Link from "next/link";

export function UserIdentityLink({ user, date }: { user: { id: string | number; name: string; avatarUrl?: string | null }; date?: string }) {
  const initial = user.name.charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Link href={`/app/perfil/${user.id}`} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-black text-indigo-700">
        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : initial}
      </Link>
      <div>
        <Link href={`/app/perfil/${user.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-700 hover:underline">{user.name}</Link>
        {date ? <p className="text-xs text-slate-500">{new Date(date).toLocaleString("es-PE")}</p> : null}
      </div>
    </div>
  );
}
