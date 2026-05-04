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
  { label: "Debates", href: "/app/debates" },
  { label: "Preguntas", href: "/app/preguntas" },
  { label: "Apuntes", href: "/app/apuntes" },
  { label: "Trámites", href: "/app/tramites" },
  { label: "Momentos", href: "/app/momentos" },
  { label: "Tienda", href: "/app/tienda" },
  { label: "Mi perfil", href: "/app/perfil" },
  { label: "Configuración de perfil", href: "/app/configuracion-perfil" },
  { label: "Admin", href: "/app/admin" },
  { label: "Admin tienda", href: "/app/admin/tienda" },
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

export interface FeedPostImage {
  id: number;
  imageUrl: string;
  mimeType: string;
  sizeBytes: number;
  position: number;
}

export interface FeedPost {
  id: number;
  content: string;
  createdAt: string;
  author: FeedAuthor;
  community: FeedCommunity | null;
  commentsCount: number;
  images: FeedPostImage[];
}



export interface FeedDiscoverySection {
  key: "communities" | "friends" | "recommended";
  title: string;
  items: FeedPost[];
}

export interface FeedDiscoveryResponse {
  sections: FeedDiscoverySection[];
  pagination: {
    page: number;
    perSection: number;
    hasNextPage: boolean;
  };
}

export interface PostComment {
  id: number;
  content: string;
  createdAt: string;
  author: FeedAuthor;
}

export interface CreatePostImagePayload {
  imageUrl: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CreateFeedPostPayload {
  content: string;
  communityId: number;
  images?: CreatePostImagePayload[];
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
  titleHighlighted?: string;
  contentHighlighted?: string;
  relevance?: number;
}

export interface SearchQuestionResult {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  community: FeedCommunity | null;
  titleHighlighted?: string;
  contentHighlighted?: string;
  relevance?: number;
}

export interface SearchCommunityResult {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  nameHighlighted?: string;
  descriptionHighlighted?: string;
  relevance?: number;
}

export interface SearchProductResult {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  viewCount: number;
  contactClickCount: number;
  category: {
    id: number;
    name: string;
  } | null;
  titleHighlighted?: string;
  descriptionHighlighted?: string;
  relevance?: number;
}

export interface SearchResults {
  query: string;
  type?: "posts" | "questions" | "communities" | "products" | "all";
  page?: number;
  limit?: number;
  total?: number;
  noResultsTracked?: boolean;
  posts: SearchPostResult[];
  questions: SearchQuestionResult[];
  communities: SearchCommunityResult[];
  products: SearchProductResult[];
}
