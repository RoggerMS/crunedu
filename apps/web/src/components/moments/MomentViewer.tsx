import type { MomentItem } from "./types";
import { MomentInfoPanel } from "./MomentInfoPanel";
import { MomentMediaPanel } from "./MomentMediaPanel";

export function MomentViewer(props: {
  moment: MomentItem;
  previousMoment: () => void;
  nextMoment: () => void;
  onLike: () => void;
  onConfirm: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onShareToFeed?: () => void;
  onRemoveFromFeed?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm md:p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
      <MomentMediaPanel
        moment={props.moment}
        previousMoment={props.previousMoment}
        nextMoment={props.nextMoment}
      />
      <MomentInfoPanel
        moment={props.moment}
        onLike={props.onLike}
        onConfirm={props.onConfirm}
        onComment={props.onComment}
        onSave={props.onSave}
        onShare={props.onShare}
        onShareToFeed={props.onShareToFeed}
        onRemoveFromFeed={props.onRemoveFromFeed}
        onDelete={props.onDelete}
      />
    </article>
  );
}
