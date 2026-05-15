"use client";

import { useState } from "react";

export function ConversarAudioPlayerMock({
  durationLabel,
}: {
  durationLabel: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState("1x");
  const totalSeconds = parseDurationToSeconds(durationLabel);
  const previewProgress = isPlaying ? 46 : 18;
  const currentSeconds = Math.round((totalSeconds * previewProgress) / 100);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-900">
        Grabación de la conversación
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying((current) => !current)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {isPlaying ? "Pausar" : "Reproducir"}
        </button>
        <div className="flex flex-1 items-end gap-1 rounded-xl bg-slate-100 p-3">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-indigo-500/70"
              style={{ height: `${8 + ((index * 9) % 24)}px` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-indigo-600"
            style={{ width: `${previewProgress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>{formatSeconds(currentSeconds)}</span>
          <span>{durationLabel}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm">
        {[
          { label: "1x", value: "1x" },
          { label: "1.25x", value: "1.25x" },
          { label: "1.5x", value: "1.5x" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSpeed(option.value)}
            className={`rounded-lg px-3 py-1.5 font-semibold ${speed === option.value ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Esta conversación fue grabada con aceptación previa de los
        participantes.
      </p>
    </article>
  );
}

function parseDurationToSeconds(durationLabel: string) {
  const matches = durationLabel.match(/(\d+)/);
  const minutes = matches ? Number(matches[1]) : 40;
  return minutes * 60;
}

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
