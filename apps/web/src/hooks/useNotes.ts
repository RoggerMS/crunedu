"use client";

import { useCallback, useEffect, useState } from "react";
import type { NoteItem } from "@/components/notes/types";
import { mapNoteApiToItem } from "@/components/notes/note-mappers";
import {
  createNote as createNoteApi,
  deleteNote as deleteNoteApi,
  getNotes,
  mapApiError,
  rateNote as rateNoteApi,
  saveNote as saveNoteApi,
  unsaveNote as unsaveNoteApi,
  type CreateNotePayload,
  type NoteListQuery,
  type UploadedNoteFile,
} from "@/lib/api-helpers";
import { buildNoteDownloadUrl, buildNoteFileUrl } from "@/lib/api-helpers";
import { useAccessToken } from "@/hooks/useAccessToken";


export type NotesFetchOptions = NoteListQuery;

export function useNotes(options: NotesFetchOptions = {}) {
  const { accessToken } = useAccessToken();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const notify = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };


  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes(options);
      setNotes((data.items ?? []).map(mapNoteApiToItem));
    } catch (err) {
      setNotes([]);
      setError(mapApiError(err, "No se pudieron cargar los apuntes."));
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function publishNote(payload: CreateNotePayload) {
    if (!accessToken) {
      notify("Inicia sesión para publicar apuntes.", "info");
      throw new Error("login required");
    }
    try {
      const created = await createNoteApi(payload, accessToken);
      setNotes((prev) => [mapNoteApiToItem(created), ...prev]);
      notify("Apunte publicado correctamente.", "success");
      return created;
    } catch (err) {
      notify(mapApiError(err, "No se pudo publicar el apunte."), "error");
      throw err;
    }
  }

  async function toggleSave(note: NoteItem) {
    if (!accessToken) return notify("Inicia sesión para guardar apuntes.", "info");
    const wasSaved = note.viewerState.saved;
    setNotes((prev) => prev.map((item) => item.id === note.id ? { ...item, viewerState: { ...item.viewerState, saved: !wasSaved }, stats: { ...item.stats, saves: Math.max(0, item.stats.saves + (wasSaved ? -1 : 1)) } } : item));
    try {
      if (wasSaved) await unsaveNoteApi(Number(note.id), accessToken);
      else await saveNoteApi(Number(note.id), accessToken);
      notify(wasSaved ? "Apunte quitado de guardados." : "Apunte guardado.", "success");
    } catch (err) {
      setNotes((prev) => prev.map((item) => item.id === note.id ? { ...item, viewerState: { ...item.viewerState, saved: wasSaved }, stats: { ...item.stats, saves: Math.max(0, item.stats.saves + (wasSaved ? 1 : -1)) } } : item));
      notify(mapApiError(err, "No se pudo actualizar el guardado."), "error");
    }
  }

  async function rateNote(note: NoteItem, value: number) {
    if (!accessToken) return notify("Inicia sesión para valorar apuntes.", "info");
    const previous = note.rating.viewerRating;
    setNotes((prev) => prev.map((item) => item.id === note.id ? { ...item, rating: { ...item.rating, viewerRating: value } } : item));
    try {
      const result = await rateNoteApi(Number(note.id), value, accessToken);
      setNotes((prev) => prev.map((item) => item.id === note.id ? { ...item, rating: { average: result.average, count: result.count, viewerRating: result.viewerRating } } : item));
      notify("Gracias por valorar este apunte.", "success");
    } catch (err) {
      setNotes((prev) => prev.map((item) => item.id === note.id ? { ...item, rating: { ...item.rating, viewerRating: previous } } : item));
      notify(mapApiError(err, "No se pudo registrar tu valoración."), "error");
    }
  }

  async function removeNote(note: NoteItem) {
    if (!accessToken) return notify("Inicia sesión para eliminar apuntes.", "info");
    try {
      await deleteNoteApi(Number(note.id), accessToken);
      setNotes((prev) => prev.filter((item) => item.id !== note.id));
      notify("Apunte eliminado.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo eliminar el apunte."), "error");
    }
  }

  async function shareNote(note: NoteItem) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app/apuntes/${note.id}`);
      notify("Enlace de apunte copiado.", "success");
    } catch {
      notify("No se pudo copiar el enlace.", "error");
    }
  }

  function downloadNote(note: NoteItem) {
    if (typeof window === "undefined") return;
    window.open(buildNoteDownloadUrl(note.id), "_blank");
  }

  return {
    notes,
    loading,
    error,
    toast,
    notify,
    retry: reload,
    publishNote,
    toggleSave,
    rateNote,
    removeNote,
    shareNote,
    downloadNote,
    uploadReference: { buildNoteDownloadUrl, buildNoteFileUrl } as { buildNoteDownloadUrl: typeof buildNoteDownloadUrl; buildNoteFileUrl: typeof buildNoteFileUrl },
  };
}

export type { CreateNotePayload, UploadedNoteFile };
