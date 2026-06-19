import type { NoteFileType } from "./types";

type Style = { label: string; className: string };

const STYLES: Record<NoteFileType, Style> = {
  pdf: { label: "PDF", className: "bg-rose-50 text-rose-700 border-rose-200" },
  word: { label: "Word", className: "bg-blue-50 text-blue-700 border-blue-200" },
  image: { label: "Imagen", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  zip: { label: "ZIP", className: "bg-amber-50 text-amber-700 border-amber-200" },
  ppt: { label: "PPT", className: "bg-orange-50 text-orange-700 border-orange-200" },
  excel: { label: "Excel", className: "bg-green-50 text-green-700 border-green-200" },
  other: { label: "Archivo", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function DocumentFileIcon({ fileType, size = "sm" }: { fileType: NoteFileType; size?: "sm" | "md" }) {
  const style = STYLES[fileType] ?? STYLES.other;
  const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return <span className={`inline-flex items-center rounded-md border font-semibold ${style.className} ${padding}`}>{style.label}</span>;
}
