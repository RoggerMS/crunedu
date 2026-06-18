"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { QuestionAttachmentPreview } from "./QuestionAttachmentPreview";
import { QuestionStatusBadge } from "./QuestionStatusBadge";
import type { QuestionItem } from "./types";

type QuestionCardProps = {
  question: QuestionItem;
  canReport?: boolean;
  onShare: () => void;
  onReport?: () => void;
  onRespond: () => void;
  onToggleAnswers: () => void;
};

export function QuestionCard({ question, canReport = false, onShare, onReport, onRespond, onToggleAnswers }: QuestionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function stopCardNavigation(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <Link href={`/app/preguntas/${question.id}`} className="block">
      <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_180px_220px]">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-700">{question.authorName}</span><span>•</span><span>{question.course}</span></div>
          <h3 className="font-bold">{question.title}</h3>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{question.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">{question.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">#{t}</span>)}</div>
          {question.bestAnswer ? <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs"><b>Mejor respuesta:</b> {question.bestAnswer.content}</p> : null}
        </div>
        <QuestionAttachmentPreview images={question.images} files={question.files} />
        <div className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-2">
            <QuestionStatusBadge status={question.status} />
            <div className="relative">
              <button
                onClick={(event) => { stopCardNavigation(event); setMenuOpen((current) => !current); }}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                aria-expanded={menuOpen}
                aria-label="Opciones de pregunta"
                type="button"
              >
                ...
              </button>
              {menuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-lg">
                  <button onClick={(event) => { stopCardNavigation(event); setMenuOpen(false); onShare(); }} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Copiar enlace</button>
                  {canReport && onReport ? <button onClick={(event) => { stopCardNavigation(event); setMenuOpen(false); onReport(); }} className="w-full rounded-lg px-3 py-2 text-left text-rose-700 hover:bg-rose-50" type="button">Reportar pregunta</button> : null}
                </div>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-slate-500">{question.stats.answers} respuestas · {question.stats.views} vistas</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={(e)=>{e.preventDefault();e.stopPropagation();onRespond();}} className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white" type="button">Responder</button>
            <button onClick={(e)=>{e.preventDefault();e.stopPropagation();onToggleAnswers();}} className="rounded-lg border px-2 py-1 text-xs" type="button">Ver respuestas</button>
            <button onClick={(e)=>{e.preventDefault();e.stopPropagation();onShare();}} className="rounded-lg border px-2 py-1 text-xs" type="button">Compartir</button>
          </div>
        </div>
      </article>
    </Link>
  );
}
