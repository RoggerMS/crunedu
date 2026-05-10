import { useState } from "react";

export function CommentBox({ onSubmit }: { onSubmit: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  return <form onSubmit={(event) => { event.preventDefault(); if (!comment.trim()) return; onSubmit(comment.trim()); setComment(""); }} className="mt-2 flex gap-2">
    <input value={comment} onChange={(event) => setComment(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Escribe un comentario..." />
    <button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white" type="submit">Enviar</button>
  </form>;
}
