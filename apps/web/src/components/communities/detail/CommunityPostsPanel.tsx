import { PostActions } from "@/components/feed/PostActions";
import type { CommunityPostModel } from "./types";

type Props = {
  posts: CommunityPostModel[];
  onCreatePost: () => void;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onSave: (postId: number) => void;
  onShare: (postId: number) => void;
  onReport: (postId: number) => void;
  onHide: (postId: number) => void;
  onDelete?: (postId: number) => void;
};

export function CommunityPostsPanel({ posts, onCreatePost, onLike, onComment, onSave, onShare, onReport, onHide, onDelete }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Publicaciones recientes</h2>
      </div>
      {posts.length ? (
        <div className="space-y-3">
          {posts.map((post) => {
            const authorName = post.authorName ?? "Estudiante CrunEdu";
            const initial = authorName.trim().charAt(0).toUpperCase() || "U";
            return (
              <article key={post.id} className="rounded-xl border border-slate-200 p-4">
                <header className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {post.authorAvatarUrl ? (
                      <img src={post.authorAvatarUrl} alt={authorName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">{initial}</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{authorName}</p>
                    <p className="text-xs text-slate-500">{post.createdAt ?? "Hace poco"}</p>
                  </div>
                </header>
                {post.title ? <h3 className="mt-3 font-semibold text-slate-900">{post.title}</h3> : null}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{post.content}</p>
                <PostActions
                  likes={post.likes}
                  comments={post.commentsCount}
                  saves={post.saves}
                  liked={post.liked}
                  saved={post.saved}
                  isMine={post.isMine}
                  onLike={() => onLike(post.id)}
                  onComment={() => onComment(post.id)}
                  onSave={() => onSave(post.id)}
                  onShare={() => onShare(post.id)}
                  onReport={() => onReport(post.id)}
                  onHide={() => onHide(post.id)}
                  {...(onDelete && post.isMine ? { onDelete: () => onDelete(post.id) } : {})}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <h3 className="font-bold text-slate-900">Aún no hay publicaciones</h3>
          <p className="mt-1 text-sm text-slate-600">Sé la primera persona en compartir algo en esta comunidad.</p>
          <button onClick={onCreatePost} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Crear primera publicación
          </button>
        </div>
      )}
    </section>
  );
}
