import { FormEvent, useState } from "react";
import { Input, PrimaryButton, SecondaryButton, Select, TextArea } from "@/components/ui";

export function ProposeTopicModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: () => void }) {
  const [topic, setTopic] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState("academicos");
  if (!open) return null;
  const submit = (e: FormEvent) => { e.preventDefault(); if (!topic.trim() || !reason.trim()) return; onSubmit(); onClose(); setTopic(""); setReason(""); setMode("academicos"); };
  return <div className="fixed inset-0 z-50 bg-black/30 p-4"><form onSubmit={submit} className="mx-auto mt-16 max-w-lg space-y-2 rounded-2xl bg-white p-4"><h3 className="font-bold">Proponer tema semanal</h3><Input placeholder="Tema propuesto" value={topic} onChange={(e)=>setTopic(e.target.value)} /><TextArea placeholder="¿Por qué sería útil debatirlo?" value={reason} onChange={(e)=>setReason(e.target.value)} /><Select value={mode} onChange={(e)=>setMode(e.target.value)}><option value="academicos">Académico</option><option value="generales">General</option></Select><div className="flex gap-2"><PrimaryButton type="submit">Enviar propuesta</PrimaryButton><SecondaryButton type="button" onClick={onClose}>Cancelar</SecondaryButton></div></form></div>;
}
