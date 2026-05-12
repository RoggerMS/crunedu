import { Bookmark, Flag, MessageCircle, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { FeedMediaGallery } from "./FeedMediaGallery";
import { FeedMediaViewer } from "./FeedMediaViewer";
import { SharedEntityCard } from "./SharedEntityCard";
import type { FeedPost } from "@/features/feed/feed.types";

export function PostCard({ post, onLike, onSave, onShare, onReport, onHide, onDelete, onOpenPost }: { post: FeedPost; onLike: (id: string | number) => void; onSave: (id: string | number) => void; onShare: (id: string | number) => void; onReport: (id: string | number, reason: string) => void; onHide: (id: string | number) => void; onDelete: (id: string | number) => void; onOpenPost: (id: string) => void }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const media = (post.attachments ?? []).map((a) => ({ id: a.id, type: a.mimeType.startsWith("video/") ? "video" as const : "image" as const, previewUrl: a.previewUrl }));
  return <article className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="text-sm font-semibold">{post.author.name}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")}</p>
    <p className="mt-1 text-xs text-indigo-700">publicación · {post.destination.label}</p>
    {post.content ? <p className="mt-2 text-sm text-slate-700">{post.content}</p> : null}
    {media.length ? <div className="mt-2"><FeedMediaGallery images={media.map((m) => ({ ...m, unavailableLabel: "Imagen pendiente de sincronización." }))} onSelect={setViewerIndex} /></div> : null}
    {post.sharedEntity ? <div className="mt-2"><SharedEntityCard entity={post.sharedEntity} /></div> : null}
    <div className="mt-3 flex flex-wrap gap-4 text-xs"><button onClick={() => onLike(post.id)}><ThumbsUp size={14} className="mr-1 inline" />Me gusta ({post.stats.likes})</button><button onClick={() => onOpenPost(post.id)}><MessageCircle size={14} className="mr-1 inline" />Comentar ({post.stats.comments})</button><button onClick={() => onSave(post.id)}><Bookmark size={14} className="mr-1 inline" />Guardar ({post.stats.saves})</button><button onClick={() => onShare(post.id)}><Share2 size={14} className="mr-1 inline" />Compartir ({post.stats.shares})</button><button onClick={() => onReport(post.id, "Contenido inapropiado")}><Flag size={14} className="mr-1 inline" />Reportar</button><button onClick={() => onHide(post.id)}>Ocultar</button><button onClick={() => onDelete(post.id)} className="text-rose-600"><Trash2 size={14} className="mr-1 inline" />Eliminar</button></div>
    <FeedMediaViewer open={viewerIndex !== null} media={media} index={viewerIndex ?? 0} onClose={() => setViewerIndex(null)} onPrev={() => setViewerIndex((prev) => prev === null ? 0 : (prev - 1 + media.length) % media.length)} onNext={() => setViewerIndex((prev) => prev === null ? 0 : (prev + 1) % media.length)} />
  </article>;
}
