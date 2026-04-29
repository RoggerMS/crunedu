export const APP_NAME = "CrunEdu";
export const APP_TAGLINE = "Apuntes, dudas y comunidad universitaria en un solo lugar.";

export const LOCAL_PORTS = {
  web: 3000,
  api: 4000,
  postgres: 5432,
  redis: 6379,
  minioApi: 9000,
  minioConsole: 9001,
  mailhogSmtp: 1025,
  mailhogUi: 8025,
} as const;

export const FILE_LIMITS = {
  avatarMaxMb: 3,
  productImageMaxMb: 3,
  documentMaxMb: 10,
  productMaxImages: 6,
  avatarTypes: ["jpg", "jpeg", "png", "webp"],
  productImageTypes: ["jpg", "jpeg", "png", "webp"],
  documentTypes: ["pdf", "docx", "pptx", "xlsx"],
  blockedTypes: ["exe", "bat", "sh", "apk", "zip", "rar", "js", "html", "php"],
} as const;

export const MAIN_NAVIGATION = [
  { label: "Inicio", href: "/app" },
  { label: "Comunidades", href: "/app/comunidades" },
  { label: "Preguntas", href: "/app/preguntas" },
  { label: "Apuntes", href: "/app/apuntes" },
  { label: "Trámites", href: "/app/tramites" },
  { label: "Momentos", href: "/app/momentos" },
  { label: "Tienda", href: "/app/tienda" },
  { label: "Perfil", href: "/app/perfil" },
  { label: "Admin reportes", href: "/app/admin/reportes" },
] as const;

export type UserRole = "USER" | "MODERATOR" | "ADMIN";
export type ContentStatus = "PUBLISHED" | "HIDDEN" | "DELETED" | "PENDING_REVIEW";
export type ProductStatus = "DRAFT" | "ACTIVE" | "HIDDEN" | "SOLD_OUT" | "DELETED";

export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  rules?: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  status: string;
  createdAt: string;
  membersCount: number;
  postsCount: number;
}

export interface FeedAuthor {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface FeedCommunity {
  id: number;
  name: string;
  slug: string;
}

export interface FeedPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: FeedAuthor;
  community: FeedCommunity | null;
  commentsCount: number;
}

export interface PostComment {
  id: number;
  content: string;
  createdAt: string;
  author: FeedAuthor;
}

export interface CreateFeedPostPayload {
  title?: string;
  content: string;
  communityId: number;
}


export interface QuestionAnswer {
  id: number;
  content: string;
  createdAt: string;
  author: FeedAuthor;
}

export interface FeedQuestion {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isResolved: boolean;
  author: FeedAuthor;
  community: FeedCommunity | null;
  answersCount: number;
  answers: QuestionAnswer[];
}

export interface SearchPostResult {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  community: FeedCommunity | null;
}

export interface SearchQuestionResult {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  community: FeedCommunity | null;
}

export interface SearchCommunityResult {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface SearchResults {
  query: string;
  posts: SearchPostResult[];
  questions: SearchQuestionResult[];
  communities: SearchCommunityResult[];
}
