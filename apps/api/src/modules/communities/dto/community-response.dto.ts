export class CommunityResponseDto {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  memberCount: number;
  createdAt: Date;
}