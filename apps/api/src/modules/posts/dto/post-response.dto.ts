import { PostImageResponseDto } from "./post-image-response.dto";

export class PostResponseDto {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  community: {
    id: number;
    name: string;
    slug: string;
  } | null;
  document: {
    id: number;
    title: string;
    fileType: string;
    sizeBytes: number;
    course: string;
  } | null;
  commentsCount: number;
  images: PostImageResponseDto[];
  isMine?: boolean;
}
