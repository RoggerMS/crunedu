export type ConversationType = 'open' | 'study' | 'question' | 'debate';

export type ConversationStatus = 'waiting' | 'live' | 'finished' | 'recorded';

export type ParticipantStatus = 'speaking' | 'listening' | 'handRaised' | 'host';

export type RecordingStatus = 'none' | 'processing' | 'available' | 'restricted';

export type ConversationVisibility = 'public' | 'university' | 'private';

export type SharedLinkType =
  | 'meet'
  | 'zoom'
  | 'discord'
  | 'teams'
  | 'document'
  | 'video'
  | 'other';

export type MaterialType = 'pdf' | 'docx' | 'pptx' | 'image' | 'link' | 'other';

export interface ConversarUser {
  id: string;
  name: string;
  avatarUrl?: string;
  university?: string;
  career?: string;
  isVerified?: boolean;
  isPremium?: boolean;
}

export interface ConversationParticipant {
  id: string;
  user: ConversarUser;
  status: ParticipantStatus;
  joinedAt?: string;
  role?: string;
}

export interface SharedLink {
  id: string;
  title: string;
  url: string;
  type: SharedLinkType;
  domain: string;
  sharedBy: ConversarUser;
  sharedAt: string;
}

export interface ConversationMaterial {
  id: string;
  title: string;
  type: MaterialType;
  size?: string;
  url?: string;
  uploadedBy: ConversarUser;
  uploadedAt: string;
}

export interface DebateArgument {
  id: string;
  stanceId: string;
  content: string;
  author: ConversarUser;
  createdAt: string;
}

export interface DebateStance {
  id: string;
  title: string;
  description?: string;
  color?: string;
  participants: number;
  arguments: DebateArgument[];
}

export interface ConversationRecording {
  id: string;
  status: RecordingStatus;
  durationLabel: string;
  audioUrl?: string;
  plays: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  status: ConversationStatus;
  title: string;
  description: string;
  category: string;
  course?: string;
  createdBy: ConversarUser;
  createdAt: string;
  visibility: ConversationVisibility;
  isRecording: boolean;
  recording: ConversationRecording | null;
  participants: ConversationParticipant[];
  talkingCount: number;
  listeningCount: number;
  tags: string[];
  materials: ConversationMaterial[];
  sharedLinks: SharedLink[];
  debateStances?: DebateStance[];
  sourceConversationId?: string;
  rules?: string;
}

export interface Companion {
  id: string;
  user: ConversarUser;
  topics: string[];
  availability: string;
  description: string;
  canVoice: boolean;
}
