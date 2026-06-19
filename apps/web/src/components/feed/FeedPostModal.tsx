import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CommentComposer } from "./CommentComposer";
import { CommentList } from "./CommentList";
import { FeedMediaGallery } from "./FeedMediaGallery";
import { FeedMediaViewer } from "./FeedMediaViewer";
import { PostActions } from "./PostActions";
import { SharedEntityCard } from "./SharedEntityCard";
import type { FeedComment, FeedPost } from "@/features/feed/feed.types";

type SortFilter = "relevant" | "recent" | "all";

export function FeedPostModal({ open, post, comments, onClose, onComment, onLikePost, onSavePost, onSharePost, onReportPost, onHidePost, onDeletePost, onLikeComment }: { open: boolean; post: FeedPost | null; comments: FeedComment[]; onClose: () => void; onComment: (postId: string, content: string, parentId?: string) => void; onLikePost: (postId: string) => void; onSavePost: (postId: string) => void; onSharePost: (postId: string) => void; onReportPost: (postId: string) => void; onHidePost: (postId: string) => void; onDeletePost: (postId: string) => void; onLikeComment: (postId: string, commentId: string) => void }) {
  const [value, setValue] = useState("");
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [filter, setFilter] = useState<SortFilter>("relevant");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const sorted = useMemo(() => {
    const list = [...comments];
    if (filter === "relevant") return list.sort((a, b) => (b.stats?.likes ?? 0) - (a.stats?.likes ?? 0) || +new Date(b.createdAt) - +new Date(a.createdAt));
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [comments, filter]);

  if (!open || !post) return null;
  const media = (post.attachments ?? []).map((a) => ({ id: a.id, type: a.mimeType.startsWith("video/") ? "video" as const : "image" as const, previewUrl: a.previewUrl, unavailableLabel: "Imagen pendiente de sincronización." }));

  return <div className="fixed inset-0 z-[65] bg-slate-950/60 p-2 backdrop-blur-sm" onClick={onClose}><div className="mx-auto mt-2 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3"><p className="text-sm font-bold">Publicación de {post.viewerState.isMine ? "Tú" : post.author.name}</p><button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X size={16} /></button></div>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <p className="text-sm font-semibold">{post.author.name}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")} · {post.destination.label}</p>
      {post.content ? <p className="mt-2 text-sm text-slate-700">{post.content}</p> : null}
      {post.sharedEntity ? <div className="mt-2"><SharedEntityCard entity={post.sharedEntity} /></div> : null}
      {media.length ? <div className="mt-3"><FeedMediaGallery images={media} onSelect={setViewerIndex} /></div> : null}
      <PostActions
        likes={post.stats.likes}
        comments={post.stats.comments}
        saves={post.stats.saves}
        liked={post.viewerState.liked}
        saved={post.viewerState.saved}
        isMine={post.viewerState.isMine}
        onLike={() => onLikePost(post.id)}
        onComment={() => {}}
        onSave={() => onSavePost(post.id)}
        onShare={() => onSharePost(post.id)}
        onReport={() => onReportPost(post.id)}
        onHide={() => onHidePost(post.id)}
        onDelete={() => onDeletePost(post.id)}
      />
      <div className="my-3 border-t" />
      <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-slate-600">Comentarios</p><select value={filter} onChange={(event) => setFilter(event.target.value as SortFilter)} className="rounded-md border px-2 py-1 text-xs"><option value="relevant">Más relevantes</option><option value="recent">Más recientes</option><option value="all">Todos</option></select></div>
      <CommentList comments={sorted} onLike={(commentId) => onLikeComment(post.id, commentId)} onReply={(comment) => { setReplyTo(comment); setValue(`@${comment.author.name} `); }} />
    </div>
    <div className="sticky bottom-0">
      <CommentComposer value={value} onChange={setValue} placeholder={replyTo ? `Responder a ${replyTo.author.name}...` : "Comentar como Tú..."} onSubmit={() => { onComment(post.id, value, replyTo?.id); setValue(""); setReplyTo(null); }} />
    </div>
    <FeedMediaViewer open={viewerIndex !== null} media={media} index={viewerIndex ?? 0} onClose={() => setViewerIndex(null)} onPrev={() => setViewerIndex((prev) => prev === null ? 0 : (prev - 1 + media.length) % media.length)} onNext={() => setViewerIndex((prev) => prev === null ? 0 : (prev + 1) % media.length)} />
  </div></div>;
}
