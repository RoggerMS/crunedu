import { useState } from "react";
export function AnswerQuestionModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (content: string) => void }) {
  const [content, setContent] = useState("");
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/40 p-4"><div className="mx-auto max-w-xl rounded-2xl bg-white p-4"><h3 className="font-bold">Responder pregunta</h3><textarea value={content} onChange={(e)=>setContent(e.target.value)} className="mt-2 w-full rounded border p-2" placeholder="Escribe una explicación clara paso a paso..." /><div className="mt-3 flex justify-end gap-2"><button onClick={onClose} className="rounded border px-3 py-1">Cancelar</button><button onClick={()=>onSubmit(content)} className="rounded bg-indigo-600 px-3 py-1 text-white">Publicar respuesta</button></div></div></div>;
}
