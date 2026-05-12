import { CommentItem } from "./CommentItem";
import type { FeedComment } from "@/features/feed/feed.types";

type CommentListProps = {
  comments: FeedComment[];
  onLike: (commentId: string) => void;
  onReply: (comment: FeedComment) => void;
};

export function CommentList({ comments, onLike, onReply }: CommentListProps) {
  if (!comments.length) return <p className="text-xs text-slate-500">Aún no hay comentarios.</p>;
  return <div className="space-y-2">{comments.map((comment) => <CommentItem key={comment.id} comment={comment} onLike={onLike} onReply={onReply} />)}</div>;
}
