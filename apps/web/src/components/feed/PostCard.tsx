import { useState } from "react";
import { FeedMediaGallery } from "./FeedMediaGallery";
import { FeedMediaViewer } from "./FeedMediaViewer";
import { PostActions } from "./PostActions";
import { SharedEntityCard } from "./SharedEntityCard";
import { DocumentAttachmentCard } from "@/components/notes/DocumentAttachmentCard";
import type { NoteFileType } from "@/components/notes/types";
import type { FeedPost } from "@/features/feed/feed.types";

export function PostCard({ post, onLike, onSave, onShare, onReport, onHide, onDelete, onEdit, onOpenPost }: { post: FeedPost; onLike: (id: string) => void; onSave: (id: string) => void; onShare: (id: string) => void; onReport: (id: string) => void; onHide: (id: string) => void; onDelete: (id: string) => void; onEdit: (post: FeedPost) => void; onOpenPost: (id: string) => void }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const media = (post.attachments ?? []).map((a) => ({ id: a.id, type: a.mimeType.startsWith("video/") ? "video" as const : "image" as const, previewUrl: a.previewUrl, unavailableLabel: "Imagen pendiente de sincronización." }));
  return <article className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-sm font-semibold">{post.author.name}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")}</p>
    <p className="mt-1 text-xs text-indigo-700">publicación · {post.destination.label}</p>
    {post.title ? <h2 className="mt-2 text-base font-bold text-slate-900">{post.title}</h2> : null}
    {post.content ? <button className="mt-2 text-left text-sm text-slate-700" onClick={() => onOpenPost(post.id)}>{post.content}</button> : null}
    {media.length ? <div className="mt-2"><FeedMediaGallery images={media} onSelect={setViewerIndex} /></div> : null}
    {post.sharedEntity ? (
      <div className="mt-2">
        {post.sharedEntity.type === "note" ? (
          <DocumentAttachmentCard
            id={post.sharedEntity.id}
            title={post.sharedEntity.title}
            fileType={(post.sharedEntity.fileType as NoteFileType) ?? "other"}
            sizeBytes={post.sharedEntity.sizeBytes}
            course={post.sharedEntity.meta}
            description={post.sharedEntity.description}
          />
        ) : (
          <SharedEntityCard entity={post.sharedEntity} />
        )}
      </div>
    ) : null}
    <PostActions
      likes={post.stats.likes}
      comments={post.stats.comments}
      saves={post.stats.saves}
      liked={post.viewerState.liked}
      saved={post.viewerState.saved}
      isMine={post.viewerState.isMine}
      onLike={() => onLike(post.id)}
      onComment={() => onOpenPost(post.id)}
      onSave={() => onSave(post.id)}
      onShare={() => onShare(post.id)}
      onReport={() => onReport(post.id)}
      onHide={() => onHide(post.id)}
      onDelete={() => onDelete(post.id)}
      onEdit={() => onEdit(post)}
    />
    <FeedMediaViewer open={viewerIndex !== null} media={media} index={viewerIndex ?? 0} onClose={() => setViewerIndex(null)} onPrev={() => setViewerIndex((prev) => prev === null ? 0 : (prev - 1 + media.length) % media.length)} onNext={() => setViewerIndex((prev) => prev === null ? 0 : (prev + 1) % media.length)} />
  </article>;
}
