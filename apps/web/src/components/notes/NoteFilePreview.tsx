import type { NoteFile } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";

function formatSize(bytes: number): string {
  if (!bytes) return "0 MB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function NoteFilePreview({ file, compact = false }: { file?: NoteFile; compact?: boolean }) {
  if (!file) return <p className="text-xs text-slate-500">Sin archivo.</p>;
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-2 ${compact ? "" : "p-3"}`}>
      <div className="flex items-center gap-2">
        <DocumentFileIcon fileType={file.fileType} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800">{file.name}</p>
          <p className="text-[11px] text-slate-500">{formatSize(file.size)}</p>
        </div>
      </div>
    </div>
  );
}

export { formatSize };
