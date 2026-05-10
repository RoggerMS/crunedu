import { X } from "lucide-react";
import Image from "next/image";
import type { LocalAttachmentFile } from "./types";

export function AttachmentPreview({ files, images, onRemoveFile, onRemoveImage }: { files: LocalAttachmentFile[]; images: Array<{ id: string; url: string }>; onRemoveFile: (id: string) => void; onRemoveImage: (id: string) => void }) {
  return <div className="space-y-2">
    {files.map((file) => <div key={file.id} className="flex items-center justify-between rounded-lg border p-2 text-xs"><div><p className="font-semibold">{file.name}</p><p className="text-slate-500">{Math.round(file.size / 1024)} KB · {file.type || "archivo"}</p></div><button aria-label="Quitar archivo" onClick={() => onRemoveFile(file.id)} className="rounded p-1 hover:bg-slate-100"><X size={14} /></button></div>)}
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{images.map((image) => <div key={image.id} className="relative"><Image src={image.url} alt="Vista previa" width={120} height={80} className="h-20 w-full rounded-lg object-cover" /><button aria-label="Quitar imagen" onClick={() => onRemoveImage(image.id)} className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"><X size={12} /></button></div>)}</div>
  </div>;
}
