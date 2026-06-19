"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { NoteFileType } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";

type Rule = { category: NoteFileType; extensions: string[]; maxBytes: number };

const RULES: Rule[] = [
  { category: "pdf", extensions: ["pdf"], maxBytes: 20 * 1024 * 1024 },
  { category: "word", extensions: ["doc", "docx"], maxBytes: 15 * 1024 * 1024 },
  { category: "image", extensions: ["jpg", "jpeg", "png", "webp"], maxBytes: 8 * 1024 * 1024 },
  { category: "zip", extensions: ["zip"], maxBytes: 25 * 1024 * 1024 },
  { category: "ppt", extensions: ["ppt", "pptx"], maxBytes: 25 * 1024 * 1024 },
  { category: "excel", extensions: ["xls", "xlsx"], maxBytes: 15 * 1024 * 1024 },
];

const ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip,.ppt,.pptx,.xls,.xlsx";

function getExt(name: string): string {
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index + 1).toLowerCase();
}

function findRule(name: string): Rule | null {
  const ext = getExt(name);
  return RULES.find((rule) => rule.extensions.includes(ext)) ?? null;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

type NoteUploadDropzoneProps = {
  file: File | null;
  onFile: (file: File | null) => void;
  error?: string | null;
};

export function NoteUploadDropzone({ file, onFile, error }: NoteUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validateAndSet(candidate: File | null) {
    if (!candidate) {
      setLocalError(null);
      onFile(null);
      return;
    }
    const rule = findRule(candidate.name);
    if (!rule) {
      setLocalError("Formato no permitido. Verifica los tipos aceptados.");
      return;
    }
    if (candidate.size > rule.maxBytes) {
      const maxMb = Math.round(rule.maxBytes / (1024 * 1024));
      setLocalError(`El archivo supera el límite de ${maxMb}MB para ${rule.category.toUpperCase()}.`);
      return;
    }
    setLocalError(null);
    onFile(candidate);
  }

  const shownError = error ?? localError;

  if (file) {
    const rule = findRule(file.name);
    const category = rule?.category ?? "other";
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-3">
          <DocumentFileIcon fileType={category} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
          <button type="button" onClick={() => { validateAndSet(null); if (inputRef.current) inputRef.current.value = ""; }} className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100" aria-label="Quitar archivo">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const dropped = e.dataTransfer.files?.[0]; if (dropped) validateAndSet(dropped); }}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400"}`}
      >
        <Upload className="h-6 w-6 text-indigo-600" />
        <span className="text-sm font-semibold text-slate-700">Arrastra tu archivo o haz clic para seleccionarlo</span>
        <span className="text-xs text-slate-500">PDF, Word, Imagen, ZIP, PPT, Excel</span>
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const candidate = e.target.files?.[0] ?? null; validateAndSet(candidate); }} />
      {shownError ? <p className="mt-2 text-xs text-rose-700">{shownError}</p> : null}
    </div>
  );
}
