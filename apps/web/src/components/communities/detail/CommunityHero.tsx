import { Share2, UserPlus } from "lucide-react";
import type { CommunityDetailModel } from "./types";

type Props = {
  community: CommunityDetailModel;
  isCreator: boolean;
  isMember: boolean;
  isPrivate?: boolean;
  joining: boolean;
  onJoin: () => void;
  onShare: () => void;
};

export function CommunityHero({ community, isCreator, isMember, isPrivate, joining, onJoin, onShare }: Props) {
  const isJoined = isMember || isCreator;
  const membersLabel = `${community.membersCount} ${community.membersCount === 1 ? "miembro" : "miembros"}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="h-56 bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 md:h-64">
        {community.coverUrl ? <img src={community.coverUrl} alt={`Portada de ${community.name}`} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="px-5 pb-6">
        <div className="-mt-14 md:-mt-16">
          <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-indigo-100 text-3xl font-black text-indigo-700 shadow-sm md:h-28 md:w-28">
            {community.avatarUrl ? (
              <img src={community.avatarUrl} alt={community.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">{community.name.charAt(0).toUpperCase()}</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-slate-950 md:text-4xl">{community.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{community.visibilityLabel} · {membersLabel}</p>
            <p className="mt-2 max-w-3xl text-slate-700">{community.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isJoined ? null : (
              <button onClick={onJoin} disabled={joining} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                <UserPlus className="h-4 w-4" />
                {joining ? "Procesando..." : isPrivate ? "Solicitar acceso" : "Unirse"}
              </button>
            )}
            <button onClick={onShare} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
