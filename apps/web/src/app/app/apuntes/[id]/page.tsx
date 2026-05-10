"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { NoteDetail } from "@/components/notes/NoteDetail";
import { noteSeed } from "@/components/notes/note-data";

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const note = noteSeed.find((n) => n.id === params.id);
  if (!note) return <div className="rounded-2xl border bg-white p-6"><p className="text-sm">No encontramos este apunte.</p><Link className="mt-3 inline-block text-indigo-700" href="/app/apuntes">Volver a Apuntes.</Link></div>;
  const related = noteSeed.filter((n) => n.id !== note.id && (n.course === note.course || n.tags.some((tag) => note.tags.includes(tag)))).slice(0, 4);
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"><NoteDetail note={note} related={related} onRate={() => undefined} onSave={() => undefined} onShare={() => navigator.clipboard.writeText(`${window.location.origin}/app/apuntes/${note.id}`)} onDownload={() => undefined} /><aside className="space-y-3 rounded-2xl border bg-white p-4 text-sm"><h3 className="font-semibold">Más del mismo curso</h3>{noteSeed.filter((n) => n.course === note.course && n.id !== note.id).slice(0, 5).map((item) => <p key={item.id}>{item.title}</p>)}</aside></div>;
}
