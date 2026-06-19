"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { QuestionAttachmentPreview } from "./QuestionAttachmentPreview";
import { QuestionStatusBadge } from "./QuestionStatusBadge";
import { formatRelativeDate } from "@/lib/format-date";
import type { QuestionItem } from "./types";

type QuestionCardProps = {
  question: QuestionItem;
  canReport?: boolean;
  onShare: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  onRespond: () => void;
  onToggleAnswers: () => void;
};

export function QuestionCard({ question, canReport = false, onShare, onReport, onDelete, onRespond, onToggleAnswers }: QuestionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function stopCardNavigation(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <Link href={`/app/preguntas/${question.id}`} className="block">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{question.authorName}</span>
            <span aria-hidden="true">•</span>
            <span>{question.course}</span>
            <span aria-hidden="true">•</span>
            <span>{formatRelativeDate(question.createdAt)}</span>
          </div>
          <div className="relative">
            <button
              onClick={(event) => { stopCardNavigation(event); setMenuOpen((current) => !current); }}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              aria-expanded={menuOpen}
              aria-label="Opciones de pregunta"
              type="button"
            >
              ⋮
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-lg">
                <button onClick={(event) => { stopCardNavigation(event); setMenuOpen(false); onShare(); }} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Copiar enlace</button>
                {canReport && onReport ? <button onClick={(event) => { stopCardNavigation(event); setMenuOpen(false); onReport(); }} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50" type="button">Reportar pregunta</button> : null}
                {question.viewerState.isMine && onDelete ? <button onClick={(event) => { stopCardNavigation(event); setMenuOpen(false); onDelete(); }} className="w-full rounded-lg px-3 py-2 text-left text-rose-700 hover:bg-rose-50" type="button">Eliminar pregunta</button> : null}
              </div>
            ) : null}
          </div>
        </div>

        <h3 className="mt-2 font-bold text-slate-900">{question.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{stripHtmlForPreview(question.description)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <QuestionStatusBadge status={question.status} />
          {question.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">#{t}</span>)}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{question.stats.answers} respuestas</span>
            <span>·</span>
            <span>{question.stats.votes} votos</span>
          </div>
          <QuestionAttachmentPreview images={question.images} files={question.files} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRespond(); }} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700" type="button">Ayudar / Responder</button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleAnswers(); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="button">Ver pregunta</button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" type="button">Compartir</button>
        </div>
      </article>
    </Link>
  );
}

function stripHtmlForPreview(content: string): string {
  if (!content) return "";
  if (!/<\/?(p|b|strong|i|em|u|s|strike|ul|ol|li|div|br|span|sup|sub|code|pre|blockquote)\b/i.test(content)) return content;
  return content.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
