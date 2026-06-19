"use client";

import type { Community } from "@crunedu/shared";
import type { NoteVisibility } from "./types";

type NoteVisibilitySelectorProps = {
  visibility: NoteVisibility;
  onVisibility: (value: NoteVisibility) => void;
  communityId?: number;
  onCommunityId: (value: number | undefined) => void;
  communities: Community[];
};

const OPTIONS: { value: NoteVisibility; label: string; hint: string }[] = [
  { value: "public", label: "Público", hint: "Visible para todos en Apuntes." },
  { value: "community", label: "Solo comunidad", hint: "Visible para miembros de la comunidad." },
  { value: "private", label: "Privado", hint: "Visible solo para ti." },
];

export function NoteVisibilitySelector({ visibility, onVisibility, communityId, onCommunityId, communities }: NoteVisibilitySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">Visibilidad</label>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { onVisibility(option.value); if (option.value !== "community") onCommunityId(undefined); }}
            className={`rounded-xl border p-3 text-left transition ${visibility === option.value ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
          >
            <p className="text-sm font-semibold text-slate-800">{option.label}</p>
            <p className="text-[11px] text-slate-500">{option.hint}</p>
          </button>
        ))}
      </div>
      {visibility === "community" ? (
        <select
          value={communityId ?? ""}
          onChange={(e) => onCommunityId(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Selecciona una comunidad</option>
          {communities.map((community) => (
            <option key={community.id} value={community.id}>{community.name}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
