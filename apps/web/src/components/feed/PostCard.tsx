import { Bookmark, Flag, MessageCircle, Share2, ThumbsUp, Trash2 } from "lucide-react";
import type { FeedPost } from "@crunedu/shared";
import { CommentBox } from "./CommentBox";
import type { LocalFeedPost } from "./types";
import { useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";
import { SharedEntityCard } from "./SharedEntityCard";
import type { FeedComment } from "@/lib/feed-storage";

export function PostCard({ post, comments, onLike, onSave, onComment, onShare, onReport, onHide, onDelete }: { post: FeedPost | LocalFeedPost; comments: FeedComment[]; onLike: (id: string | number) => void; onSave: (id: string | number) => void; onComment: (id: string | number, comment: string) => void; onShare: (id: string | number) => void; onReport: (id: string | number, reason: string) => void; onHide: (id: string | number) => void; onDelete: (id: string | number) => void }) {
  const [openComment, setOpenComment] = useState(false);
  const isLocal = "viewerState" in post;
  const authorName = isLocal ? post.authorName : `${post.author.firstName ?? ""} ${post.author.lastName ?? ""}`.trim() || "Estudiante";
  return <article className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-sm font-semibold">{authorName}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")}</p>
    {isLocal ? <p className="mt-1 text-xs text-indigo-700">publicación · {post.communityName ?? "Feed general"}</p> : null}
    {post.content ? <p className="mt-2 text-sm text-slate-700">{post.content}</p> : null}
    {isLocal ? <div className="mt-2"><FeedAttachmentPreview files={[]} images={post.images ?? []} /></div> : null}
    {isLocal && post.sharedEntity ? <div className="mt-2"><SharedEntityCard entity={post.sharedEntity} /></div> : null}
    <div className="mt-3 flex flex-wrap gap-4 text-xs"><button onClick={() => onLike(post.id)}><ThumbsUp size={14} className="mr-1 inline" />Me gusta ({isLocal ? post.stats.likes : 0})</button><button onClick={() => setOpenComment((v) => !v)}><MessageCircle size={14} className="mr-1 inline" />Comentar ({isLocal ? post.stats.comments : post.commentsCount})</button><button onClick={() => onSave(post.id)}><Bookmark size={14} className="mr-1 inline" />Guardar ({isLocal ? post.stats.saves : 0})</button><button onClick={() => onShare(post.id)}><Share2 size={14} className="mr-1 inline" />Compartir</button><button onClick={() => onReport(post.id, "Contenido inapropiado")}><Flag size={14} className="mr-1 inline" />Reportar</button><button onClick={() => onHide(post.id)}>Ocultar</button>{isLocal ? <button onClick={() => onDelete(post.id)} className="text-rose-600"><Trash2 size={14} className="mr-1 inline" />Eliminar</button> : null}</div>
    {openComment ? <CommentBox onSubmit={(comment) => onComment(post.id, comment)} /> : null}
    {comments.length ? <div className="mt-2 space-y-1">{comments.map((comment) => <p key={comment.id} className="rounded-lg bg-slate-50 px-2 py-1 text-xs"><span className="font-semibold">{comment.author.name}:</span> {comment.content}</p>)}</div> : null}
  </article>;
}
