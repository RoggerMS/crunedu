"use client";

import { PrimaryButton, SecondaryButton } from "@/components/ui";
import type { Companion } from "@/modules/conversar/types";
import { getInitials } from "@/modules/conversar/utils";

type Props = {
  companion: Companion;
  invitePrepared: boolean;
  onInvite: () => void;
};

export function ConversarCompanionCard({
  companion,
  invitePrepared,
  onInvite,
}: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-black text-indigo-700">
            {getInitials(companion.user.name)}
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              {companion.user.name}
            </h2>
            <p className="text-sm text-slate-600">
              {companion.user.career ?? "Área no especificada"}
            </p>
            <p className="text-xs text-slate-500">
              {companion.user.university ?? "Universidad no especificada"}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${companion.canVoice ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
        >
          {companion.canVoice ? "Disponible con voz" : "Solo texto por ahora"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {companion.topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
          >
            {topic}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-700">{companion.description}</p>
      <p className="mt-2 text-xs font-medium text-slate-500">
        Disponibilidad: {companion.availability}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <PrimaryButton type="button" onClick={onInvite}>
          {invitePrepared ? "Invitación preparada" : "Invitar a conversar"}
        </PrimaryButton>
        <SecondaryButton type="button" disabled>
          Ver perfil
        </SecondaryButton>
      </div>
    </article>
  );
}
