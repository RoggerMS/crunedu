"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { NoteCard } from "@/components/notes/NoteCard";
import { NOTE_COURSES } from "@/components/notes/note-data";
import { NotesFilters } from "@/components/notes/NotesFilters";
import { NotesHeader } from "@/components/notes/NotesHeader";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { useNotes } from "@/hooks/useNotes";

export default function NotesPage() {
  const router = useRouter();
  const q = (useSearchParams().get("q") ?? "").toLowerCase();
  const [openModal, setOpenModal] = useState(false);
  const [sortFilter, setSortFilter] = useState("Para ti");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [courseFilter, setCourseFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const { notes, stats, addNote, saveNote, shareNote, downloadNote, rateNote, saveDraft, pulseToast, toast } = useNotes();

  const filtered = useMemo(() => {
    let list = notes.filter((n) => (!q || [n.title, n.description, n.course, n.authorName, ...(n.tags ?? []), n.file?.name ?? "", n.file?.fileType ?? ""].join(" ").toLowerCase().includes(q)) && (courseFilter === "Todos" || n.course === courseFilter));
    if (sortFilter === "Mis apuntes") list = list.filter((n) => n.viewerState.isMine);
    if (sortFilter === "Guardados") list = list.filter((n) => n.viewerState.saved);
    if (sortFilter === "Más descargados") list = list.toSorted((a, b) => b.stats.downloads - a.stats.downloads);
    if (sortFilter === "Más guardados") list = list.toSorted((a, b) => b.stats.saves - a.stats.saves);
    if (sortFilter === "Mejor valorados") list = list.toSorted((a, b) => b.rating.average - a.rating.average);
    if (sortFilter === "Recientes") list = list.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortFilter === "Sin revisar") list = list.filter((n) => n.status === "pendiente_revision");
    if (typeFilter !== "Todos") list = list.filter((n) => [n.file?.fileType?.toLowerCase(), n.materialType.toLowerCase()].join(" ").includes(typeFilter.toLowerCase()));
    return list;
  }, [notes, q, courseFilter, sortFilter, typeFilter]);

  const pageItems = filtered.slice((page - 1) * 8, page * 8);

  return <section className="mx-auto max-w-[1540px] px-4 sm:px-6 lg:px-8"><div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bóveda Académica en fase Beta: Explora nuestros apuntes verificados. La subida de documentos propios estará habilitada próximamente.</div><div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><main className="space-y-4"><NotesHeader onOpenModal={() => setOpenModal(true)} onMine={() => setSortFilter("Mis apuntes")} onSaved={() => setSortFilter("Guardados")} stats={stats} /><NotesFilters rows={[{ key: "sort", active: sortFilter, options: ["Para ti", "Recientes", "Más guardados", "Más descargados", "Mejor valorados", "Mis apuntes", "Guardados", "Sin revisar"] }, { key: "type", active: typeFilter, options: ["Todos", "PDF", "Word", "PPT", "Imagen", "Resumen", "Ejercicios", "Fórmulas", "Guías", "Separatas"] }, { key: "course", active: courseFilter, options: ["Todos", ...NOTE_COURSES] }]} onChange={(key, value) => { if (key === "sort") setSortFilter(value); if (key === "type") setTypeFilter(value); if (key === "course") setCourseFilter(value); setPage(1); }} />
      {toast ? <p className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">{toast}</p> : null}
      <div className="space-y-2">{pageItems.length === 0 ? <div className="rounded-2xl border bg-white p-6 text-sm">No encontramos apuntes con esos filtros.</div> : pageItems.map((note) => <NoteCard key={note.id} note={note} onMenu={() => pulseToast("Opciones avanzadas disponibles próximamente.")} onSave={() => { saveNote(note.id); pulseToast(note.viewerState.saved ? "Apunte quitado de guardados." : "Apunte guardado."); }} onShare={() => void shareNote(note.id)} onDownload={() => downloadNote(note.id)} onRate={(value) => { rateNote(note.id, value); pulseToast("Gracias por valorar este apunte."); }} />)}</div>
      <div className="rounded-2xl border bg-white p-3 text-sm"><p>Mostrando 1 a {pageItems.length} de 1,284 apuntes</p><div className="mt-2 flex gap-2"><button className="rounded-lg border px-2 py-1" onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button><button className="rounded-lg border px-2 py-1">1</button><button className="rounded-lg border px-2 py-1">2</button><button className="rounded-lg border px-2 py-1">3</button><span className="px-2 py-1">...</span><button className="rounded-lg border px-2 py-1" onClick={() => setPage((p) => p + 1)}>Siguiente</button></div></div>
    </main>
    <NotesSidebar notes={notes} onCourseClick={(c) => setCourseFilter(c)} onGuide={() => pulseToast("Guía disponible próximamente.")} onNoteClick={(id) => router.push(`/app/apuntes/${id}`)} /></div>
    <CreateNoteModal open={openModal} onClose={() => setOpenModal(false)} onSaveDraft={saveDraft} onPublish={(payload) => { if (!payload.title.trim()) return pulseToast("Título obligatorio."); if (!payload.course) return pulseToast("Curso obligatorio."); if (!payload.file && !payload.description.trim()) return pulseToast("Agrega archivo o descripción suficiente."); addNote({ id: crypto.randomUUID(), title: payload.title, description: payload.description, course: payload.course, materialType: payload.materialType, authorName: "Tú", createdAt: new Date().toISOString(), status: "nuevo", tags: payload.tags, file: payload.file ? { ...payload.file, id: crypto.randomUUID() } : undefined, images: payload.images?.map((image) => ({ ...image, id: crypto.randomUUID() })) ?? [], rating: { average: 0, count: 0 }, stats: { downloads: 0, saves: 0, comments: 0, views: 0 }, viewerState: { saved: false, isMine: true } }); setOpenModal(false); pulseToast("Apunte publicado correctamente."); }} />
  </section>;
}
