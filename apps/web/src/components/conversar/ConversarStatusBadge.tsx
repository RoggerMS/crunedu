import { getConversationStatusLabel, getConversationStatusTone, getConversationTypeLabel, getConversationTypeTone } from "@/modules/conversar/utils";
import type { ConversationStatus, ConversationType } from "@/modules/conversar/types";

const statusToneClasses: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

const typeToneClasses: Record<string, string> = {
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function ConversarStatusBadge({ status }: { status: ConversationStatus }) {
  const tone = getConversationStatusTone(status);

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusToneClasses[tone]}`}>{getConversationStatusLabel(status)}</span>;
}

export function ConversarTypeBadge({ type }: { type: ConversationType }) {
  const tone = getConversationTypeTone(type);

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${typeToneClasses[tone]}`}>{getConversationTypeLabel(type)}</span>;
}
