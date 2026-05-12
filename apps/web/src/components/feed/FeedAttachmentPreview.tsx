import { X } from "lucide-react";
import { FeedFilePreview } from "./FeedFilePreview";
import { FeedMediaGallery } from "./FeedMediaGallery";
import type { LocalAttachmentFile } from "./types";

export function FeedAttachmentPreview({ files, images, onRemoveFile, onRemoveImage }: { files: LocalAttachmentFile[]; images: Array<{ id: string; url: string; alt?: string }>; onRemoveFile?: (id: string) => void; onRemoveImage?: (id: string) => void }) {
  return <div className="space-y-2">{images.length ? <div className="space-y-2"><FeedMediaGallery images={images} />{onRemoveImage ? <div className="flex flex-wrap gap-1">{images.map((image) => <button key={image.id} onClick={() => onRemoveImage(image.id)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">Quitar imagen <X size={12} /></button>)}</div> : null}</div> : null}{files.length ? <div className="space-y-2"><FeedFilePreview files={files} />{onRemoveFile ? <div className="flex flex-wrap gap-1">{files.map((file) => <button key={file.id} onClick={() => onRemoveFile(file.id)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">Quitar {file.name} <X size={12} /></button>)}</div> : null}</div> : null}</div>;
}
