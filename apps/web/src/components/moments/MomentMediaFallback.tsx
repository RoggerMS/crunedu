import { AlertTriangle, CalendarDays, Camera, GraduationCap, HandPlatter, Laugh, PackageSearch, Users } from "lucide-react";
import type { MomentType } from "./types";

type Variant = { gradient: string; Icon: typeof Camera };

const variants: Record<MomentType, Variant> = {
  now: { gradient: "from-violet-500 via-indigo-500 to-blue-500", Icon: GraduationCap },
  campus: { gradient: "from-violet-500 via-indigo-500 to-blue-500", Icon: GraduationCap },
  event: { gradient: "from-blue-500 via-indigo-500 to-violet-500", Icon: CalendarDays },
  alert: { gradient: "from-orange-400 via-rose-400 to-red-500", Icon: AlertTriangle },
  food: { gradient: "from-amber-300 via-orange-400 to-orange-500", Icon: HandPlatter },
  humor: { gradient: "from-fuchsia-400 via-violet-500 to-purple-500", Icon: Laugh },
  lost_found: { gradient: "from-emerald-400 via-teal-500 to-sky-500", Icon: PackageSearch },
  community: { gradient: "from-indigo-500 via-violet-500 to-purple-600", Icon: Users },
};

export function MomentMediaFallback({
  momentType,
  title,
  compact = false,
}: {
  momentType: MomentType;
  title: string;
  compact?: boolean;
}) {
  const { gradient, Icon } = variants[momentType];

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${gradient}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26),transparent_45%)]" />
      <div className="absolute -left-10 top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
      <div className="absolute -bottom-8 right-4 h-32 w-32 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center text-white">
        <span className="rounded-2xl bg-white/20 p-3 shadow-lg ring-1 ring-white/40 backdrop-blur">
          <Icon className={compact ? "h-4 w-4" : "h-8 w-8"} />
        </span>
        {!compact ? (
          <>
            <p className="text-sm font-semibold tracking-wide text-white/95">Momento sin imagen</p>
            <p className="max-w-sm text-sm text-white/85">{title}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
