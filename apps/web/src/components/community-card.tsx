import type { Community } from "@crunedu/shared";
import Link from "next/link";

interface CommunityCardProps {
  community: Community;
  href?: string;
}

export function CommunityCard({ community, href }: CommunityCardProps) {
  const initial = community.name.charAt(0).toUpperCase();

  return (
    <Link href={href ?? `/app/comunidades/${community.id}`} className="group">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition-shadow hover:shadow-medium">
        <div className="h-20 bg-slate-200">
          {community.coverUrl ? (
            <img
              src={community.coverUrl}
              alt={`Portada de ${community.name}`}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="-mt-6 px-5 pb-5">
          <div className="mb-3 h-12 w-12 overflow-hidden rounded-2xl border-4 border-white bg-indigo-50">
            {community.avatarUrl ? (
              <img
                src={community.avatarUrl}
                alt={community.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-black text-indigo-700">
                {initial}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-950">{community.name}</h2>

          <p className="mt-2 hidden text-sm text-slate-600 group-hover:block">
            {community.description ||
              "Esta comunidad aún no tiene descripción."}
          </p>

          <div className="mt-3 text-xs text-slate-500">
            <span>{community.membersCount} miembros</span>
            <span className="mx-2">•</span>
            <span>{community.postsCount} publicaciones</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
