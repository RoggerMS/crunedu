"use client";

import { useMemo, useState } from "react";
import { noteSeed } from "@/components/notes/note-data";
import type { NoteDraftInput, NoteItem } from "@/components/notes/types";

export function useNotes() {
  const [notes, setNotes] = useState<NoteItem[]>(noteSeed);
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => ({ shared: notes.length, downloads: notes.reduce((a, n) => a + n.stats.downloads, 0), students: 742, courses: new Set(notes.map((n) => n.course)).size }), [notes]);

  const pulseToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const addNote = (_note: NoteItem) => pulseToast("Función en preparación para la próxima versión.");
  const saveNote = (_id: string) => pulseToast("Función en preparación para la próxima versión.");
  const rateNote = (_id: string, _rating: number) => pulseToast("Función en preparación para la próxima versión.");
  const addComment = (_id: string, _content: string) => pulseToast("Función en preparación para la próxima versión.");

  const shareNote = async (id: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/app/apuntes/${id}`);
    pulseToast("Enlace de apunte copiado.");
  };

  const downloadNote = (id: string) => pulseToast(notes.find((n) => n.id === id)?.file?.url ? "Descarga iniciada." : "Descarga disponible cuando el archivo esté conectado.");
  const saveDraft = (_input: NoteDraftInput) => pulseToast("Función en preparación para la próxima versión.");

  return { notes, setNotes, stats, toast, addNote, saveNote, rateNote, shareNote, downloadNote, addComment, saveDraft, pulseToast };
}
