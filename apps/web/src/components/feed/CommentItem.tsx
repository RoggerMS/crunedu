import type { FeedComment } from "@/features/feed/feed.types";

type CommentItemProps = {
  comment: FeedComment;
  onLike: (commentId: string) => void;
  onReply: (comment: FeedComment) => void;
};

export function CommentItem({ comment, onLike, onReply }: CommentItemProps) {
  return <article className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
    <p className="text-xs font-semibold text-slate-700">{comment.author.name} · {new Date(comment.createdAt).toLocaleString("es-PE")}</p>
    <p className="mt-1">{comment.content}</p>
    <div className="mt-2 flex gap-3 text-xs text-slate-600">
      <button onClick={() => onLike(comment.id)}>Me gusta ({comment.stats?.likes ?? 0})</button>
      <button onClick={() => onReply(comment)}>Responder</button>
      <button onClick={() => navigator.clipboard.writeText(comment.content)}>Compartir</button>
    </div>
  </article>;
}
