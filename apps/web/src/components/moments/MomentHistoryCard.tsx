import Image from "next/image";
import type { MomentItem } from "./types";
export function MomentHistoryCard({ moment, onClick }: { moment: MomentItem; onClick: ()=>void }) { return <button onClick={onClick} className="flex min-w-[220px] items-center gap-3 rounded-2xl border bg-white p-2 text-left"><Image src={moment.media[0]?.url ?? "https://picsum.photos/seed/fallback/120/120"} alt={moment.title} width={56} height={56} className="h-14 w-14 rounded-xl object-cover"/><span className="text-sm font-medium">{moment.title}</span></button>; }
