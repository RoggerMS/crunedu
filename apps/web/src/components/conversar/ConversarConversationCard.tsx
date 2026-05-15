import { PrimaryButton, SecondaryButton } from "@/components/ui";
import type { Conversation } from "@/modules/conversar/types";
import { formatParticipantSummary, getConversationActionLabel } from "@/modules/conversar/utils";
import { ConversarStatusBadge, ConversarTypeBadge } from "./ConversarStatusBadge";

interface ConversarConversationCardProps {
  conversation: Conversation;
  onPrimaryAction?: (conversation: Conversation) => void;
  isPrimaryDisabled?: boolean;
}

export function ConversarConversationCard({
  conversation,
  onPrimaryAction,
  isPrimaryDisabled = true,
}: ConversarConversationCardProps) {
  return (
    <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <ConversarTypeBadge type={conversation.type} />
        <ConversarStatusBadge status={conversation.status} />
        {conversation.status === "live" && conversation.isRecording ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">● Grabando</span>
        ) : null}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">{conversation.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{conversation.description}</p>
      </div>

      <div className="text-sm text-slate-600">
        <p>
          Creado por <span className="font-semibold text-slate-800">{conversation.createdBy.name}</span>
        </p>
        <p>{conversation.course ?? conversation.category}</p>
      </div>

      {conversation.type === "debate" && conversation.debateStances?.length ? (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Posturas del debate</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {conversation.debateStances.map((stance) => (
              <span key={stance.id} className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-700">
                {stance.title}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {conversation.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">#{tag}</span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">{formatParticipantSummary(conversation)}</p>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="button" disabled={isPrimaryDisabled} onClick={() => onPrimaryAction?.(conversation)}>
            {getConversationActionLabel(conversation)}
          </PrimaryButton>
          <SecondaryButton type="button" disabled>Ver detalles</SecondaryButton>
        </div>
      </div>
    </article>
  );
}
