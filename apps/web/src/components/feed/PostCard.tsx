import { Bookmark, Flag, MessageCircle, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { CommentBox } from "./CommentBox";
import { useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";
import { SharedEntityCard } from "./SharedEntityCard";
import type { FeedComment, FeedPost } from "@/features/feed/feed.types";

export function PostCard({ post, comments, onLike, onSave, onComment, onShare, onReport, onHide, onDelete }: { post: FeedPost; comments: FeedComment[]; onLike: (id: string | number) => void; onSave: (id: string | number) => void; onComment: (id: string | number, comment: string) => void; onShare: (id: string | number) => void; onReport: (id: string | number, reason: string) => void; onHide: (id: string | number) => void; onDelete: (id: string | number) => void }) {
  const [openComment, setOpenComment] = useState(false);
  return <article className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-sm font-semibold">{post.author.name}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")}</p>
    <p className="mt-1 text-xs text-indigo-700">publicación · {post.destination.label}</p>
    {post.content ? <p className="mt-2 text-sm text-slate-700">{post.content}</p> : null}
    {post.attachments?.length ? <div className="mt-2"><FeedAttachmentPreview files={[]} images={post.attachments.map((a) => ({ id: a.id, mediaId: a.storageKey ?? a.id, previewUrl: a.previewUrl }))} /></div> : null}
    {post.sharedEntity ? <div className="mt-2"><SharedEntityCard entity={post.sharedEntity} /></div> : null}
    <div className="mt-3 flex flex-wrap gap-4 text-xs"><button onClick={() => onLike(post.id)}><ThumbsUp size={14} className="mr-1 inline" />Me gusta ({post.stats.likes})</button><button onClick={() => setOpenComment((v) => !v)}><MessageCircle size={14} className="mr-1 inline" />Comentar ({post.stats.comments})</button><button onClick={() => onSave(post.id)}><Bookmark size={14} className="mr-1 inline" />Guardar ({post.stats.saves})</button><button onClick={() => onShare(post.id)}><Share2 size={14} className="mr-1 inline" />Compartir</button><button onClick={() => onReport(post.id, "Contenido inapropiado")}><Flag size={14} className="mr-1 inline" />Reportar</button><button onClick={() => onHide(post.id)}>Ocultar</button><button onClick={() => onDelete(post.id)} className="text-rose-600"><Trash2 size={14} className="mr-1 inline" />Eliminar</button></div>
    {openComment ? <CommentBox onSubmit={(comment) => onComment(post.id, comment)} /> : null}
    {comments.length ? <div className="mt-2 space-y-1">{comments.map((comment) => <p key={comment.id} className="rounded-lg bg-slate-50 px-2 py-1 text-xs"><span className="font-semibold">{comment.author.name}:</span> {comment.content}</p>)}</div> : null}
  </article>;
}
