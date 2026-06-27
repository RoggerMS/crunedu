import Link from "next/link";
import { Heart, ImageIcon } from "lucide-react";
import type { MomentItem } from "./types";
import { MomentMediaFallback } from "./MomentMediaFallback";
import { buildMomentMediaUrl } from "@/lib/moments-api";

export function MomentsGalleryView({ moments, loading }: { moments: MomentItem[]; loading?: boolean }) {
  if (loading) {
    return (
      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      </section>
    );
  }

  if (moments.length === 0) {
    return (
      <section>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Galería</h1>
        <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center">
          <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-slate-600">Aún no hay momentos con fotos o videos.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900">Galería</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {moments.map((m) => {
          const media = m.media[0];
          const isVideo = media?.type === "video";
          const mediaSrc = media?.url ? buildMomentMediaUrl(media.url) : null;
          return (
            <Link href={`/app/momentos/${m.id}?from=gallery`} key={m.id} className="group overflow-hidden rounded-2xl border bg-white p-2 transition hover:shadow-md">
              <div className="relative h-44 w-full overflow-hidden rounded-xl">
                {mediaSrc ? (
                  <img src={mediaSrc} alt={m.title} className="h-full w-full rounded-xl object-cover" loading="lazy" />
                ) : (
                  <MomentMediaFallback momentType={m.type} title={m.title} compact />
                )}
                {isVideo ? <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">VIDEO</span> : null}
              </div>
              <p className="mt-2 line-clamp-1 font-semibold text-slate-800">{m.title}</p>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{m.location ?? "Sin ubicación"}</span>
                <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{m.stats.likes}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
