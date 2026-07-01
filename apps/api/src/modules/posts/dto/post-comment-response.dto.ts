export class PostCommentResponseDto {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    username: string | null;
    isVerified: boolean;
  };
}
