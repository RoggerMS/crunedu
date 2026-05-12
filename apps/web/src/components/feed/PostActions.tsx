import { Bookmark, Flag, MessageCircle, Share2, ThumbsUp, Trash2 } from "lucide-react";
import type { FeedPost } from "@/features/feed/feed.types";

type PostActionsProps = {
  post: FeedPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
  onHide: (postId: string) => void;
  onDelete: (postId: string) => void;
  onEdit?: (postId: string) => void;
};

const actionClass = "inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100";

export function PostActions({ post, onLike, onComment, onSave, onShare, onReport, onHide, onDelete, onEdit }: PostActionsProps) {
  return <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
    <button className={actionClass} onClick={() => onLike(post.id)}><ThumbsUp size={14} />Me gusta ({post.stats.likes})</button>
    <button className={actionClass} onClick={() => onComment(post.id)}><MessageCircle size={14} />Comentar ({post.stats.comments})</button>
    <button className={actionClass} onClick={() => onSave(post.id)}><Bookmark size={14} />Guardar ({post.stats.saves})</button>
    <button className={actionClass} onClick={() => onShare(post.id)}><Share2 size={14} />Compartir ({post.stats.shares})</button>
    <button className={actionClass} onClick={() => onReport(post.id)}><Flag size={14} />Reportar</button>
    <button className={actionClass} onClick={() => onHide(post.id)}>Ocultar</button>
    {post.viewerState.isMine && onEdit ? <button className={actionClass} onClick={() => onEdit(post.id)}>Editar</button> : null}
    {post.viewerState.isMine ? <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-rose-600 hover:bg-rose-50" onClick={() => onDelete(post.id)}><Trash2 size={14} />Eliminar</button> : null}
  </div>;
}
