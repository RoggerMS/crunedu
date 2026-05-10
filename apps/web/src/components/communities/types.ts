import type { Community } from "@crunedu/shared";

export type CommunityCategory =
  | "carreras"
  | "cursos"
  | "tramites"
  | "debates"
  | "oportunidades"
  | "investigacion"
  | "general";

export type CommunityViewModel = {
  id: string | number;
  name: string;
  description?: string;
  category: CommunityCategory;
  memberCount: number;
  postCount: number;
  isMember?: boolean;
  isRecommended?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  bannerUrl?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  isPrivate?: boolean;
};

export type CommunityFilter =
  | "todas"
  | "mis-comunidades"
  | "carreras"
  | "cursos"
  | "tramites"
  | "debates"
  | "mas-activas"
  | "nuevas";

export type CommunitySort = "mas-recientes" | "mas-antiguas";

export function inferCategory(community: Pick<Community, "name" | "description">): CommunityCategory {
  const text = `${community.name} ${community.description ?? ""}`.toLowerCase();
  if (/(debate|acad[eé]mico|discusi[oó]n)/.test(text)) return "debates";
  if (/(tr[aá]mite|constancia|matr[ií]cula|beca)/.test(text)) return "tramites";
  if (/(c[aá]lculo|estad[ií]stica|f[ií]sica|programaci[oó]n)/.test(text)) return "cursos";
  if (/(matem[aá]tica|inform[aá]tica|ingenier[ií]a|ciencias)/.test(text)) return "carreras";
  if (/(tesis|investigaci[oó]n|metodolog[ií]a)/.test(text)) return "investigacion";
  if (/(oportunidad|empleo|bolsa|pr[aá]ctica)/.test(text)) return "oportunidades";
  return "general";
}

export function toCommunityViewModel(community: Community): CommunityViewModel {
  const createdAt = community.createdAt;
  const createdDaysAgo = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)));
  const isNew = createdDaysAgo <= 10;

  return {
    id: community.id,
    name: community.name,
    description: community.description ?? undefined,
    category: inferCategory(community),
    memberCount: community.membersCount ?? 0,
    postCount: community.postsCount ?? 0,
    isMember: false,
    isRecommended: (community.membersCount ?? 0) >= 500,
    isNew,
    isActive: (community.postsCount ?? 0) > 0,
    bannerUrl: community.coverUrl ?? undefined,
    icon: community.avatarUrl ?? undefined,
    createdAt,
    updatedAt: createdAt,
    isPrivate: false,
  };
}
