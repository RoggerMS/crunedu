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
  { label: "Conversar", href: "/app/conversar" },
  { label: "Preguntas", href: "/app/preguntas" },
  { label: "Apuntes", href: "/app/apuntes" },
  { label: "Universidad", href: "/app/universidad" },
  { label: "Momentos", href: "/app/momentos" },
  { label: "Tienda", href: "/app/tienda" },
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
  avatarUrl: string | null;
  username: string | null;
  isVerified: boolean;
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

export interface FeedPostDocument {
  id: number;
  title: string;
  fileType: string;
  sizeBytes: number;
  course: string;
}

export interface FeedPost {
  id: number;
  title: string;
  content: string;
  inFeed?: boolean;
  visibility?: string;
  viewCount?: number;
  shareCount?: number;
  createdAt: string;
  author: FeedAuthor;
  community: FeedCommunity | null;
  document: FeedPostDocument | null;
  commentsCount: number;
  likesCount?: number;
  savesCount?: number;
  images: FeedPostImage[];
  isMine?: boolean;
  liked?: boolean;
  saved?: boolean;
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
  title?: string;
  content: string;
  communityId?: number;
  images?: CreatePostImagePayload[];
  visibility?: "PUBLIC" | "FOLLOWERS" | "FRIENDS" | "ONLY_ME";
  inFeed?: boolean;
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

// --- CONVERSAR (salas de audio) ---
export type ConversationType = "OPEN" | "STUDY" | "QUESTION" | "DEBATE";
export type ConversationStatus = "DRAFT" | "WAITING" | "LIVE" | "ENDED" | "CANCELLED";
export type ConversationVisibility = "PUBLIC" | "UNIVERSITY" | "PRIVATE";
export type ConversationParticipantRole = "HOST" | "MODERATOR" | "SPEAKER" | "LISTENER";
export type ConversationSpeakerRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ConversationRecordingStatus = "REQUESTED" | "RECORDING" | "PROCESSING" | "AVAILABLE" | "FAILED" | "DELETED";
export type ConversationMaterialType = "PDF" | "DOCX" | "PPTX" | "IMAGE" | "OTHER";
export type ConversationSharedLinkType = "MEET" | "ZOOM" | "TEAMS" | "DISCORD" | "DOCUMENT" | "VIDEO" | "OTHER";

export interface ConversationAuthor {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface ConversationListItem {
  id: number;
  slug: string;
  type: ConversationType;
  status: ConversationStatus;
  title: string;
  description: string;
  category: string;
  course: string | null;
  visibility: ConversationVisibility;
  isRecording: boolean;
  isLocked: boolean;
  tags: string[];
  createdAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  maxParticipants: number;
  maxSpeakers: number;
  allowListeners: boolean;
  allowRaiseHand: boolean;
  allowNewStances: boolean;
  livekitRoomName: string;
  conclusion: string | null;
  createdBy: ConversationAuthor;
  university: { id: number; name: string; shortName: string | null } | null;
  participantsCount: number;
  speakersCount: number;
  listenersCount: number;
  isMine: boolean;
  materials: Array<{ id: number; title: string; type: ConversationMaterialType; fileUrl: string; mimeType: string; sizeBytes: number; createdAt: string; uploadedById: number }>;
  links: Array<{ id: number; title: string; url: string; domain: string; type: ConversationSharedLinkType; createdAt: string; sharedById: number }>;
}

export interface ConversationDetail extends ConversationListItem {
  rules: string | null;
  debateStances: Array<{ id: number; title: string; description: string | null; order: number; participants: number; argumentsCount: number }>;
  recordings: Array<{ id: number; durationSeconds: number; plays: number; status: ConversationRecordingStatus }>;
  startSubscriptionsCount: number;
}

export interface ConversationListResponse {
  items: ConversationListItem[];
  nextCursor: string | null;
}

export interface ConversationJoinResponse {
  conversation: ConversationDetail;
  livekitUrl: string;
  token: string;
  role: ConversationParticipantRole;
}

export interface ConversationSpeakerRequest {
  id: number;
  conversationId: number;
  userId: number;
  status: ConversationSpeakerRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedById: number | null;
  user: ConversationAuthor;
}

export interface ConversationInvite {
  id: number;
  token: string;
  expiresAt: string;
  maxUses: number;
}

export interface ConversationRecordingItem {
  id: number;
  conversationId: number;
  title: string;
  type: ConversationType;
  category: string;
  durationSeconds: number;
  sizeBytes: number;
  plays: number;
  status: ConversationRecordingStatus;
  createdAt: string;
  fileUrl: string | null;
  mimeType: string;
}

export interface ConversationCompanion {
  userId: number;
  description: string;
  topics: string[];
  courses: string[];
  availabilityText: string | null;
  availableForVoice: boolean;
  isActive: boolean;
  user: {
    id: number;
    name: string;
    avatarUrl: string | null;
    university: { id: number; name: string; shortName: string | null } | null;
    career: { id: number; name: string } | null;
  };
  isMine: boolean;
}

export interface ConversationDebateStance {
  id: number;
  title: string;
  description: string | null;
  order: number;
  participants: number;
  argumentsCount: number;
  memberships: Array<{ userId: number; user: ConversationAuthor }>;
  arguments: Array<{ id: number; content: string; createdAt: string; updatedAt: string; authorId: number; author: ConversationAuthor }>;
}

export interface CreateConversationPayload {
  title: string;
  description: string;
  category?: string;
  course?: string;
  rules?: string;
  type?: ConversationType;
  visibility?: ConversationVisibility;
  maxParticipants?: number;
  maxSpeakers?: number;
  allowListeners?: boolean;
  allowRaiseHand?: boolean;
  recordingEnabled?: boolean;
  allowNewStances?: boolean;
  tags?: string[];
  startNow?: boolean;
  initialStances?: Array<{ title: string; description?: string }>;
  initialLinkUrl?: string;
  initialLinkTitle?: string;
}
