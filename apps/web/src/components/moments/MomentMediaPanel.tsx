import Image from "next/image";
import { ImageIcon, VideoIcon } from "lucide-react";
import type { MomentItem } from "./types";

function isSafeImageSrc(src?: string) {
  return Boolean(src && (src.startsWith("/") || src.startsWith("blob:") || src.startsWith("data:image/")));
}

function MomentMediaFallback({ label, type }: { label: string; type?: "image" | "video" }) {
  const Icon = type === "video" ? VideoIcon : ImageIcon;
  return (
    <div className="flex min-h-[300px] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-200 via-violet-200 to-sky-200 text-slate-700">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-white/70 p-3 shadow-sm">
          <Icon className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold">Momento sin imagen</p>
        <p className="max-w-xs text-xs text-slate-600">{label}</p>
      </div>
    </div>
  );
}

export function MomentMediaPanel({ moment, previousMoment, nextMoment }: { moment: MomentItem; previousMoment: ()=>void; nextMoment: ()=>void }) {
  const media = moment.media[0];
  const mediaSrc = media?.url;
  const canRender = isSafeImageSrc(mediaSrc);
  const isBlobOrData = Boolean(mediaSrc && (mediaSrc.startsWith("blob:") || mediaSrc.startsWith("data:image/")));

  return <div className="relative">{canRender && mediaSrc ? (
    isBlobOrData ? (
      <img src={mediaSrc} alt={media?.alt ?? moment.title} className="h-full min-h-[300px] w-full rounded-3xl object-cover" />
    ) : (
      <Image src={mediaSrc} alt={media?.alt ?? moment.title} width={1200} height={700} className="h-full min-h-[300px] w-full rounded-3xl object-cover" />
    )
  ) : (
    <MomentMediaFallback label={moment.title} type={media?.type} />
  )}<button onClick={previousMoment} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2">◀</button><button onClick={nextMoment} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2">▶</button></div>;
}
