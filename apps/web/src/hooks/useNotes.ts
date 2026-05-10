"use client";

import { useMemo, useState } from "react";
import { noteSeed } from "@/components/notes/note-data";
import type { NoteDraftInput, NoteItem } from "@/components/notes/types";

const DRAFTS_KEY = "crunedu_note_drafts";

export function useNotes() {
  const [notes, setNotes] = useState<NoteItem[]>(noteSeed);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => ({ shared: notes.length, downloads: notes.reduce((a, n) => a + n.stats.downloads, 0), students: 742, courses: new Set(notes.map((n) => n.course)).size }), [notes]);

  const pulseToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const addNote = (note: NoteItem) => setNotes((current) => [note, ...current]);
  const saveNote = (id: string) => setNotes((current) => current.map((n) => n.id === id ? { ...n, viewerState: { ...n.viewerState, saved: !n.viewerState.saved }, stats: { ...n.stats, saves: n.viewerState.saved ? Math.max(0, n.stats.saves - 1) : n.stats.saves + 1 } } : n));
  const rateNote = (id: string, rating: number) => setNotes((current) => current.map((n) => n.id === id ? { ...n, rating: { average: Number(((n.rating.average * n.rating.count + rating) / (n.rating.count + 1)).toFixed(1)), count: n.rating.count + 1, viewerRating: rating } } : n));
  const addComment = (id: string, content: string) => setNotes((current) => current.map((n) => n.id === id ? { ...n, stats: { ...n.stats, comments: n.stats.comments + 1 }, commentsPreview: [{ id: crypto.randomUUID(), authorName: "Tú", content, createdAt: new Date().toISOString() }, ...(n.commentsPreview ?? [])] } : n));

  const shareNote = async (id: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/app/apuntes/${id}`);
    pulseToast("Enlace de apunte copiado.");
  };

  const downloadNote = (id: string) => pulseToast(notes.find((n) => n.id === id)?.file?.url ? "Descarga iniciada." : "Descarga disponible cuando el archivo esté conectado.");
  const saveDraft = (input: NoteDraftInput) => {
    if (!input.title.trim() && !input.description.trim()) return pulseToast("No hay contenido para guardar.");
    const current = JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]") as unknown[];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify([{ ...input, createdAt: new Date().toISOString() }, ...current]));
    pulseToast("Borrador guardado.");
  };

  return { notes, setNotes, stats, toast, addNote, saveNote, rateNote, shareNote, downloadNote, addComment, saveDraft, pulseToast };
}
