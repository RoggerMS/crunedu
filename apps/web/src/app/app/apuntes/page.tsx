"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { NoteCard } from "@/components/notes/NoteCard";
import { NotesFilters } from "@/components/notes/NotesFilters";
import { NotesHeader } from "@/components/notes/NotesHeader";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { useNotes } from "@/hooks/useNotes";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const [openModal, setOpenModal] = useState(false);
  const [courseFilter, setCourseFilter] = useState("Todos");
  const { notes, stats, addNote, saveNote, shareNote, downloadNote, rateNote, saveDraft, pulseToast, toast } = useNotes();

  const filtered = useMemo(() => notes.filter((n) => (courseFilter === "Todos" || n.course === courseFilter) && (!q || [n.title, n.description, n.course, n.authorName, ...(n.tags ?? []), n.file?.name ?? "", n.file?.fileType ?? ""].join(" ").toLowerCase().includes(q))), [notes, courseFilter, q]);

  return <section className="space-y-4"><NotesHeader onOpenModal={() => setOpenModal(true)} stats={stats} />
    <NotesFilters options={["Todos", "Matemática", "Estadística", "Física", "Programación", "Historia"]} active={courseFilter} onChange={setCourseFilter} />
    {toast ? <p className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{toast}</p> : null}
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]"> <div className="space-y-3">{filtered.length === 0 ? <div className="rounded-2xl border bg-white p-6 text-sm">No encontramos apuntes con ese término.</div> : filtered.map((note) => <NoteCard key={note.id} note={note} onSave={() => { saveNote(note.id); pulseToast(note.viewerState.saved ? "Apunte quitado de guardados." : "Apunte guardado."); }} onShare={() => void shareNote(note.id)} onDownload={() => downloadNote(note.id)} onRate={(value) => { rateNote(note.id, value); pulseToast("Gracias por valorar este apunte."); }} />)}</div>
      <NotesSidebar notes={notes} onCourseClick={(c) => setCourseFilter(c)} onGuide={() => pulseToast("Guía disponible próximamente.")} onNoteClick={(id) => router.push(`/app/apuntes/${id}`)} /></div>
    <CreateNoteModal open={openModal} onClose={() => setOpenModal(false)} onSaveDraft={saveDraft} onPublish={(payload) => { if (!payload.title.trim()) return pulseToast("Agrega un título para publicar el apunte."); if (!payload.course) return pulseToast("Selecciona un curso o categoría."); addNote({ id: crypto.randomUUID(), title: payload.title, description: payload.description, course: payload.course, materialType: payload.materialType, authorName: "Tú", createdAt: new Date().toISOString(), status: "nuevo", tags: payload.tags, file: payload.file ? { ...payload.file, id: crypto.randomUUID() } : undefined, images: [], rating: { average: 0, count: 0 }, stats: { downloads: 0, saves: 0, comments: 0, views: 0 }, viewerState: { saved: false, isMine: true } }); setOpenModal(false); pulseToast("Apunte publicado."); }} />
  </section>;
}
