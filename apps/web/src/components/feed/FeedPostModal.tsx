import { Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FeedMediaGallery } from "./FeedMediaGallery";
import { SharedEntityCard } from "./SharedEntityCard";
import type { FeedComment, FeedPost } from "@/features/feed/feed.types";

export function FeedPostModal({ open, post, comments, onClose, onComment }: { open: boolean; post: FeedPost | null; comments: FeedComment[]; onClose: () => void; onComment: (postId: string, content: string) => void }) {
  const [value, setValue] = useState("");
  const hasMedia = Boolean(post?.attachments?.length);
  const sorted = useMemo(() => [...comments].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)), [comments]);
  if (!open || !post) return null;

  return <div className="fixed inset-0 z-[65] bg-slate-950/60 p-2 backdrop-blur-sm" onClick={onClose}><div className={`mx-auto mt-2 max-h-[95vh] overflow-y-auto rounded-2xl bg-white ${hasMedia ? "max-w-6xl" : "max-w-3xl"}`} onClick={(e) => e.stopPropagation()}>
    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3"><p className="text-sm font-bold">Publicación</p><button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X size={16} /></button></div>
    <div className={`${hasMedia ? "grid md:grid-cols-2" : "block"}`}>
      {hasMedia ? <div className="border-b p-3 md:border-b-0 md:border-r"><FeedMediaGallery images={(post.attachments ?? []).map((a) => ({ id: a.id, previewUrl: a.previewUrl }))} /></div> : null}
      <div className="space-y-3 p-4"><div><p className="text-sm font-semibold">{post.author.name}</p><p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-PE")} · {post.destination.label}</p></div>
        {post.content ? <p className="text-sm text-slate-700">{post.content}</p> : null}
        {post.sharedEntity ? <SharedEntityCard entity={post.sharedEntity} /> : null}
        <div className="space-y-2 border-t pt-3">{sorted.length ? sorted.map((comment) => <div key={comment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><p className="text-xs font-semibold text-slate-700">{comment.author.name} · {new Date(comment.createdAt).toLocaleString("es-PE")}</p><p>{comment.content}</p></div>) : <p className="text-xs text-slate-500">Aún no hay comentarios.</p>}</div>
        <div className="flex gap-2"><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Escribe un comentario..." className="flex-1 rounded-xl border px-3 py-2 text-sm" /><button disabled={!value.trim()} onClick={() => { onComment(post.id, value); setValue(""); }} className="rounded-xl bg-indigo-600 px-3 py-2 text-white disabled:bg-slate-300"><Send size={15} /></button></div>
      </div>
    </div>
  </div></div>;
}
