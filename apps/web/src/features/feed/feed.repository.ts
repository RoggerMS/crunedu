import type { CreateFeedPostInput, FeedComment, FeedPost } from "./feed.types";

export interface FeedRepository {
  listPosts(): Promise<FeedPost[]>;
  createPost(input: CreateFeedPostInput): Promise<FeedPost>;
  updatePost(post: FeedPost): Promise<FeedPost>;
  deletePost(postId: string): Promise<void>;
  likePost(postId: string): Promise<FeedPost>;
  unlikePost(postId: string): Promise<FeedPost>;
  savePost(postId: string): Promise<FeedPost>;
  unsavePost(postId: string): Promise<FeedPost>;
  listComments(postId: string): Promise<FeedComment[]>;
  addComment(postId: string, content: string, parentId?: string): Promise<FeedComment>;
  likeComment(postId: string, commentId: string): Promise<FeedComment[]>;
  reportPost(postId: string, reason: string, detail?: string): Promise<void>;
  hidePost(postId: string): Promise<void>;
  sharePost(postId: string): Promise<FeedPost>;
}
