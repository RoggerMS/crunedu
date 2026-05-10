import type { NoteFile } from "./types";

export function NoteFilePreview({ file }: { file?: NoteFile }) {
  if (!file) return <p className="text-xs text-slate-500">Sin archivo.</p>;
  return <div className="rounded-xl border border-slate-200 p-2 text-xs"><p className="font-semibold">{file.name}</p><p className="text-slate-500">{file.fileType.toUpperCase()} · {(file.size / 1_000_000).toFixed(1)} MB</p></div>;
}
