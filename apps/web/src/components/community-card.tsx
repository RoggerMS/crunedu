import type { Community } from "@crunedu/shared";
import Link from "next/link";

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const initial = community.name.charAt(0).toUpperCase();

  return (
    <Link href={`/app/comunidades/${community.slug}`}>
      <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-medium">
        <div className="flex items-start gap-4">
          {community.avatarUrl ? (
            <img
              src={community.avatarUrl}
              alt={community.name}
              className="h-12 w-12 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-black text-indigo-700">
              {initial}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-950">{community.name}</h2>
            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {community.membersCount} miembros
            </span>
          </div>
        </div>
        {community.description && (
          <p className="mt-4 line-clamp-2 text-sm text-slate-600">
            {community.description}
          </p>
        )}
        <div className="mt-auto pt-4">
          <span className="text-xs text-slate-500">
            {community.postsCount} publicaciones
          </span>
        </div>
      </article>
    </Link>
  );
}