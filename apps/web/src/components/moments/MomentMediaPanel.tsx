import Image from "next/image";
import type { MomentItem } from "./types";

export function MomentMediaPanel({ moment, previousMoment, nextMoment }: { moment: MomentItem; previousMoment: ()=>void; nextMoment: ()=>void }) {
  const media = moment.media[0];
  return <div className="relative"><Image src={media.url} alt={media.alt ?? moment.title} width={1200} height={700} className="h-full min-h-[300px] w-full rounded-3xl object-cover"/><button onClick={previousMoment} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2">◀</button><button onClick={nextMoment} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2">▶</button></div>;
}
