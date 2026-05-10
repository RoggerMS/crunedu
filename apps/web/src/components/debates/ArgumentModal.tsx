import { FormEvent, useState } from "react";
import { DebateItem } from "./types";
import { Input, PrimaryButton, SecondaryButton, Select, TextArea } from "@/components/ui";

export function ArgumentModal({ debate, onClose, onSubmit }: { debate: DebateItem | null; onClose: () => void; onSubmit: (side: "a" | "b", content: string) => void }) {
  const [side, setSide] = useState<"a" | "b">("a");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  if (!debate) return null;
  const submit = (e: FormEvent) => { e.preventDefault(); if (!content.trim()) return; onSubmit(side, content + (source ? ` (Fuente: ${source})` : "")); setContent(""); setSource(""); onClose(); };
  return <div className="fixed inset-0 z-50 bg-black/30 p-4"><form onSubmit={submit} className="mx-auto mt-16 max-w-lg space-y-2 rounded-2xl bg-white p-4"><h3 className="font-bold">Responder con argumento</h3><Select value={side} onChange={(e)=>setSide(e.target.value as "a"|"b")}><option value="a">Postura A</option><option value="b">Postura B</option></Select><TextArea placeholder="Escribe tu argumento" value={content} onChange={(e)=>setContent(e.target.value)} /><Input placeholder="Fuente o referencia (opcional)" value={source} onChange={(e)=>setSource(e.target.value)} /><div className="flex gap-2"><PrimaryButton type="submit">Publicar argumento</PrimaryButton><SecondaryButton type="button" onClick={onClose}>Cancelar</SecondaryButton></div></form></div>;
}
