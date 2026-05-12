import type { FeedRepository } from "./feed.repository";
import type { CreateFeedPostInput, FeedAttachment, FeedComment, FeedPost, FeedPostType } from "./feed.types";
import { appendEvent, loadComments, loadHidden, loadPosts, loadReports, saveComments, saveHidden, savePosts, saveReports } from "./feed-storage";
import { createObjectUrlFromStoredBlob } from "./feed-media-store";

const mapType = (raw: unknown): FeedPostType => (raw === "publicación" || raw === "publicacion" ? "text" : typeof raw === "string" ? (raw as FeedPostType) : "text");

export const normalizeFeedPost = (raw: any): FeedPost => ({
  id: String(raw?.id ?? crypto.randomUUID()),
  type: mapType(raw?.type),
  author: { id: String(raw?.author?.id ?? "me"), name: raw?.author?.name ?? raw?.authorName ?? "Tú", avatarUrl: raw?.author?.avatarUrl ?? raw?.authorAvatarUrl },
  content: String(raw?.content ?? ""),
  destination: { type: raw?.destination?.type ?? "general", id: raw?.destination?.id, label: raw?.destination?.label ?? raw?.communityName ?? "Feed general" },
  visibility: raw?.visibility ?? "public",
  attachments: ((raw?.attachments ?? raw?.images ?? []) as any[]).map((item): FeedAttachment => ({ id: String(item.id ?? crypto.randomUUID()), type: "image", name: item.name ?? "image", mimeType: item.mimeType ?? "image/*", size: Number(item.size ?? 0), previewUrl: item.previewUrl, storageKey: item.storageKey ?? item.mediaId })),
  sharedEntity: raw?.sharedEntity,
  createdAt: raw?.createdAt ?? new Date().toISOString(),
  updatedAt: raw?.updatedAt,
  stats: { likes: Number(raw?.stats?.likes ?? 0), comments: Number(raw?.stats?.comments ?? 0), saves: Number(raw?.stats?.saves ?? 0), shares: Number(raw?.stats?.shares ?? 0) },
  viewerState: { liked: Boolean(raw?.viewerState?.liked), saved: Boolean(raw?.viewerState?.saved), isMine: raw?.viewerState?.isMine ?? true },
});

const localFeedRepository: FeedRepository = {
  async listPosts() {
    const hidden = new Set(loadHidden());
    const commentsByPost = loadComments();
    const posts = loadPosts().map(normalizeFeedPost).filter((p) => !hidden.has(p.id));
    for (const post of posts) {
      for (const attachment of post.attachments ?? []) {
        if (!attachment.previewUrl && attachment.storageKey) {
          try { attachment.previewUrl = await createObjectUrlFromStoredBlob(attachment.storageKey) ?? undefined; } catch {}
        }
      }
      const total = commentsByPost[post.id]?.length ?? 0;
      if (post.stats.comments !== total) post.stats.comments = total;
    }
    return posts;
  },
  async createPost(input) {
    const post: FeedPost = normalizeFeedPost({ id: `local-${Date.now()}`, type: input.attachments?.length ? "image" : "text", content: input.content, attachments: input.attachments ?? [], destination: input.destination ?? { type: "general", label: "Feed general" }, visibility: input.visibility ?? "public", createdAt: new Date().toISOString() });
    const current = loadPosts().map(normalizeFeedPost);
    savePosts([post, ...current]);
    appendEvent({ type: "create_post", id: post.id, date: new Date().toISOString() });
    return post;
  },
  async updatePost(post) { const updated = loadPosts().map(normalizeFeedPost).map((p) => (p.id === post.id ? post : p)); savePosts(updated); return post; },
  async deletePost(postId) { savePosts(loadPosts().map(normalizeFeedPost).filter((p) => p.id !== postId)); },
  async likePost(postId) { const post = (await this.listPosts()).find((p) => p.id === postId); if (!post) throw new Error("Post not found"); post.viewerState.liked = true; post.stats.likes += 1; return this.updatePost(post); },
  async unlikePost(postId) { const post = (await this.listPosts()).find((p) => p.id === postId); if (!post) throw new Error("Post not found"); post.viewerState.liked = false; post.stats.likes = Math.max(0, post.stats.likes - 1); return this.updatePost(post); },
  async savePost(postId) { const post = (await this.listPosts()).find((p) => p.id === postId); if (!post) throw new Error("Post not found"); post.viewerState.saved = true; post.stats.saves += 1; return this.updatePost(post); },
  async unsavePost(postId) { const post = (await this.listPosts()).find((p) => p.id === postId); if (!post) throw new Error("Post not found"); post.viewerState.saved = false; post.stats.saves = Math.max(0, post.stats.saves - 1); return this.updatePost(post); },
  async listComments(postId) { return loadComments()[postId] ?? []; },
  async addComment(postId, content) { const comment: FeedComment = { id: crypto.randomUUID(), postId, author: { id: "me", name: "Tú" }, content, createdAt: new Date().toISOString() }; const comments = loadComments(); comments[postId] = [comment, ...(comments[postId] ?? [])]; saveComments(comments); const post = (await this.listPosts()).find((p) => p.id === postId); if (post) { post.stats.comments += 1; await this.updatePost(post); } return comment; },
  async reportPost(postId, reason, detail) { const reports = loadReports(); reports.unshift({ postId, reason, detail, createdAt: new Date().toISOString() }); saveReports(reports); },
  async hidePost(postId) { saveHidden(Array.from(new Set([...loadHidden(), postId]))); },
  async sharePost(postId) { const post = (await this.listPosts()).find((p) => p.id === postId); if (!post) throw new Error("Post not found"); post.stats.shares += 1; return this.updatePost(post); },
};

export { localFeedRepository };
