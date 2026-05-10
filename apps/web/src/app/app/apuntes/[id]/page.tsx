"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { NoteDetail } from "@/components/notes/NoteDetail";
import { noteSeed } from "@/components/notes/note-data";

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const note = noteSeed.find((n) => n.id === params.id);
  if (!note) return <div className="rounded-2xl border bg-white p-6"><p className="text-sm">No encontramos este apunte.</p><Link className="mt-3 inline-block text-indigo-700" href="/app/apuntes">Volver a Apuntes</Link></div>;
  return <div className="grid gap-4 xl:grid-cols-[1fr_320px]"><NoteDetail note={note} onRate={() => undefined} /><aside className="rounded-2xl border bg-white p-4 text-sm">Consejos de uso y apuntes relacionados próximamente.</aside></div>;
}
