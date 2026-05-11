import type { MomentItem } from "./types";
import { MomentInfoPanel } from "./MomentInfoPanel";
import { MomentMediaPanel } from "./MomentMediaPanel";

export function MomentViewer(props: { moment: MomentItem; previousMoment: ()=>void; nextMoment: ()=>void; onBoost: ()=>void; onPass: ()=>void; onComment: ()=>void; onSave: ()=>void; onShare: ()=>void }) {
  return <article className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]"><MomentMediaPanel moment={props.moment} previousMoment={props.previousMoment} nextMoment={props.nextMoment} /><MomentInfoPanel moment={props.moment} onBoost={props.onBoost} onPass={props.onPass} onComment={props.onComment} onSave={props.onSave} onShare={props.onShare} /></article>;
}
