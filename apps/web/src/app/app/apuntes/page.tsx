"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { NoteCard } from "@/components/notes/NoteCard";
import { NoteFiltersRail } from "@/components/notes/NoteFiltersRail";
import { NotesFilters } from "@/components/notes/NotesFilters";
import { NotesHeader } from "@/components/notes/NotesHeader";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { useNotes } from "@/hooks/useNotes";
import { useCommunities } from "@/hooks/useCommunities";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createReport, getNoteContributors, mapApiError, type NoteContributor, type NoteListQuery } from "@/lib/api-helpers";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q")?.trim() ?? "";
  const initialCommunityId = searchParams.get("communityId") ? Number(searchParams.get("communityId")) : undefined;
  const { communities } = useCommunities();
  const { accessToken, isAuthenticated } = useAccessToken();

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sort, setSort] = useState("recent");
  const [course, setCourse] = useState("Todos");
  const [materialType, setMaterialType] = useState("Todos");
  const [fileType, setFileType] = useState("Todos");
  const [view, setView] = useState<"all" | "mine" | "saved">("all");
  const [openModal, setOpenModal] = useState(false);
  const [contributors, setContributors] = useState<NoteContributor[]>([]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let active = true;
    getNoteContributors()
      .then((data) => { if (active) setContributors(data); })
      .catch(() => { if (active) setContributors([]); });
    return () => { active = false; };
  }, []);

  const query: NoteListQuery = useMemo(() => ({
    q: debouncedSearch || undefined,
    sort: sort as NoteListQuery["sort"],
    course: course !== "Todos" ? course : undefined,
    materialType: materialType !== "Todos" ? materialType : undefined,
    fileType: fileType !== "Todos" ? fileType : undefined,
    communityId: initialCommunityId,
    mine: view === "mine" ? true : undefined,
    saved: view === "saved" ? true : undefined,
  }), [debouncedSearch, sort, course, materialType, fileType, initialCommunityId, view]);

  const { notes, loading, error, toast, notify, retry, toggleSave, rateNote, removeNote, shareNote, downloadNote } = useNotes(query);

  async function handleReport(noteId: string) {
    if (!isAuthenticated || !accessToken) return notify("Inicia sesión para reportar un apunte.", "info");
    try {
      await createReport({ targetType: "DOCUMENT", targetId: Number(noteId), reason: "Reporte de apunte" }, accessToken);
      notify("Reporte enviado.", "success");
    } catch (err) {
      notify(mapApiError(err, "No se pudo enviar el reporte."), "error");
    }
  }

  function handleDelete(noteId: string) {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    const confirmed = window.confirm("¿Seguro que deseas eliminar este apunte? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    void removeNote(note);
  }

  return (
    <section className="mx-auto max-w-[1540px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
      {toast ? <div className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}

      <CreateNoteModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onPublished={() => void retry()}
        onToast={notify}
        communities={communities}
        initialCommunityId={initialCommunityId}
      />

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside className="hidden space-y-4 xl:block">
          <NoteFiltersRail
            course={course}
            onCourse={setCourse}
            materialType={materialType}
            onMaterialType={setMaterialType}
            fileType={fileType}
            onFileType={setFileType}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          <NotesHeader
            onOpenModal={() => {
              if (!isAuthenticated) { notify("Inicia sesión para publicar apuntes.", "info"); router.push("/login?returnUrl=/app/apuntes"); return; }
              setOpenModal(true);
            }}
            onMine={() => { if (!isAuthenticated) { notify("Inicia sesión para ver tus apuntes.", "info"); return; } setView((prev) => (prev === "mine" ? "all" : "mine")); }}
            onSaved={() => { if (!isAuthenticated) { notify("Inicia sesión para ver tus guardados.", "info"); return; } setView((prev) => (prev === "saved" ? "all" : "saved")); }}
            search={search}
            onSearchChange={setSearch}
          />
          <NotesFilters sort={sort} onSort={setSort} />

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm text-rose-700">{error}</p>
              <button onClick={() => void retry()} className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reintentar</button>
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="font-bold text-slate-900">No hay apuntes con estos filtros</h3>
              <p className="mt-1 text-sm text-slate-600">Sé la primera persona en compartir material útil para este filtro.</p>
              <button onClick={() => setOpenModal(true)} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Subir apunte</button>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSave={() => void toggleSave(note)}
                  onShare={() => void shareNote(note)}
                  onDownload={() => downloadNote(note)}
                  onReport={() => void handleReport(note.id)}
                  onDelete={note.viewerState.canDelete ? () => handleDelete(note.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <NotesSidebar notes={notes} onNoteClick={(id) => router.push(`/app/apuntes/${id}`)} contributors={contributors} />
      </div>
    </section>
  );
}
