import type { SharedEntity } from "./types";

export function SharedEntityCard({ entity }: { entity: SharedEntity }) {
  return <a href={entity.href} className="block rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs hover:border-indigo-300"><p className="font-semibold">{entity.title}</p>{entity.description ? <p className="mt-1 text-slate-600">{entity.description}</p> : null}{entity.meta ? <p className="mt-1 text-slate-500">{entity.meta}</p> : null}</a>;
}
