type Props = {
  onOpenPost: () => void;
  authorInitial: string;
  authorAvatarUrl?: string | null;
  authorName?: string;
};

export function CommunityComposer({ onOpenPost, authorInitial, authorAvatarUrl, authorName }: Props) {
  const initial = (authorInitial || "U").trim().charAt(0).toUpperCase() || "U";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {authorAvatarUrl ? (
            <img src={authorAvatarUrl} alt={authorName ?? "Tu avatar"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">{initial}</div>
          )}
        </div>
        <button onClick={onOpenPost} className="w-full rounded-full border border-slate-200 px-4 py-2 text-left text-sm text-slate-500">
          Comparte algo con la comunidad...
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={onOpenPost} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
          Publicación
        </button>
      </div>
    </section>
  );
}
