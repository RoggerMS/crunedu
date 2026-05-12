import { Bookmark, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import type { FeedPost } from "@crunedu/shared";
import { CommentBox } from "./CommentBox";
import type { LocalFeedPost } from "./types";
import { useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";

export function PostCard({ post, onLike, onSave, onComment, onShare }: { post: FeedPost | LocalFeedPost; onLike: (id: string | number) => void; onSave: (id: string | number) => void; onComment: (id: string | number, comment: string) => void; onShare: (id: string | number) => void }) {
  const [openComment, setOpenComment] = useState(false);
  const isLocal = "viewerState" in post;
  const authorName = isLocal ? post.authorName : `${post.author.firstName ?? ""} ${post.author.lastName ?? ""}`.trim() || "Estudiante";
  const likes = isLocal ? post.stats.likes : 0;
  const comments = isLocal ? post.stats.comments : post.commentsCount;
  const saves = isLocal ? post.stats.saves : 0;
  const liked = isLocal ? post.viewerState.liked : false;
  const saved = isLocal ? post.viewerState.saved : false;
  const tags = "tags" in post ? post.tags : [];
  const communityName = "communityName" in post ? post.communityName : undefined;
  return <article className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-sm font-semibold">{authorName}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")}</p>
    {isLocal ? <p className="mt-1 text-xs text-indigo-700">{post.type} · {communityName ?? "Feed general"}</p> : null}
    {"title" in post && post.title ? <h3 className="mt-2 text-base font-bold">{post.title}</h3> : null}
    {post.content ? <p className="mt-2 text-sm text-slate-700">{post.content}</p> : null}
    {isLocal ? <div className="mt-2"><FeedAttachmentPreview files={post.files ?? []} images={post.images ?? []} /></div> : null}
    {tags.length ? <div className="mt-2 flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px]">#{tag}</span>)}</div> : null}
    <div className="mt-3 flex gap-4 text-xs"><button onClick={() => onLike(post.id)} className={liked ? "text-indigo-700" : "text-slate-600"}><ThumbsUp size={14} className="mr-1 inline" />Me gusta ({likes})</button><button onClick={() => setOpenComment((v) => !v)} className="text-slate-600"><MessageCircle size={14} className="mr-1 inline" />Comentar ({comments})</button><button onClick={() => onSave(post.id)} className={saved ? "text-indigo-700" : "text-slate-600"}><Bookmark size={14} className="mr-1 inline" />Guardar ({saves})</button><button onClick={() => onShare(post.id)} className="text-slate-600"><Share2 size={14} className="mr-1 inline" />Compartir</button></div>
    {openComment ? <CommentBox onSubmit={(comment) => onComment(post.id, comment)} /> : null}
    {isLocal && post.commentsPreview?.length ? <div className="mt-2 space-y-1">{post.commentsPreview.map((comment) => <p key={comment.id} className="rounded-lg bg-slate-50 px-2 py-1 text-xs"><span className="font-semibold">{comment.authorName}:</span> {comment.content}</p>)}</div> : null}
  </article>;
}
