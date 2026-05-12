import type { LocalAttachmentFile } from "./types";

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileMeta(file: LocalAttachmentFile) {
  const name = file.name.toLowerCase();
  if (file.type.includes("pdf") || name.endsWith(".pdf")) return { icon: "📄", label: "PDF" };
  if (name.endsWith(".doc") || name.endsWith(".docx")) return { icon: "📝", label: "Word" };
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return { icon: "📊", label: "Presentación" };
  if (file.type.startsWith("image/")) return { icon: "🖼️", label: "Imagen" };
  return { icon: "📎", label: "Archivo" };
}

export function FeedFilePreview({ files }: { files: LocalAttachmentFile[] }) {
  return <div className="space-y-2">{files.map((file) => {
    const meta = getFileMeta(file);
    return <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"><p className="font-semibold">{meta.icon} {file.name}</p><p className="text-slate-500">{meta.label} · {formatSize(file.size)}</p></div>;
  })}</div>;
}
