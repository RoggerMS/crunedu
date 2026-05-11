import Image from "next/image";
import type { MomentItem } from "./types";

function isSafeLocalSrc(src?: string) {
  return Boolean(src?.startsWith("/"));
}

export function MomentDetail({ moment }: { moment: MomentItem }) {
  const mediaSrc = moment.media[0]?.url;

  return <article className="mx-auto max-w-4xl space-y-4 rounded-3xl border bg-white p-5">{isSafeLocalSrc(mediaSrc) ? <Image src={mediaSrc} alt={moment.title} width={1200} height={700} className="w-full rounded-2xl object-cover"/> : <div className="grid h-[320px] place-items-center rounded-2xl bg-gradient-to-br from-indigo-200 via-violet-200 to-sky-200 text-sm font-semibold text-slate-700">Momento sin imagen</div>}<h1 className="text-3xl font-black">{moment.title}</h1><p>{moment.description}</p><p className="text-sm text-slate-600">{moment.location} · Expira {new Date(moment.expiresAt).toLocaleString("es-PE")}</p><div className="flex flex-wrap gap-2">{moment.tags.map((tag)=><span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs">#{tag}</span>)}</div></article>;
}
