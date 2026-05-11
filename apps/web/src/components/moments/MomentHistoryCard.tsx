import Image from "next/image";
import type { MomentItem } from "./types";

export function MomentHistoryCard({ moment, onClick }: { moment: MomentItem; onClick: ()=>void }) { return <button onClick={onClick} className="flex min-w-[220px] items-center gap-3 rounded-2xl border bg-white p-2 text-left">{moment.media[0]?.url?.startsWith("/") ? <Image src={moment.media[0].url} alt={moment.title} width={56} height={56} className="h-14 w-14 rounded-xl object-cover"/> : <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-indigo-200 via-violet-200 to-sky-200 text-[10px] font-semibold text-slate-700">Sin imagen</div>}<span className="text-sm font-medium">{moment.title}</span></button>; }
