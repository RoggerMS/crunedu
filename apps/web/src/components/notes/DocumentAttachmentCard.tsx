import Link from "next/link";
import type { NoteFileType } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

type DocumentAttachmentCardProps = {
  id: string | number;
  title: string;
  fileType: NoteFileType;
  sizeBytes?: number;
  course?: string | null;
  description?: string | null;
};

export function DocumentAttachmentCard({ id, title, fileType, sizeBytes, course, description }: DocumentAttachmentCardProps) {
  return (
    <Link href={`/app/apuntes/${id}`} className="block rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-indigo-300">
      <div className="flex items-center gap-3">
        <DocumentFileIcon fileType={fileType} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">
            {course ? course : "Apunte"}
            {sizeBytes ? ` · ${formatSize(sizeBytes)}` : ""}
          </p>
          {description ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{description}</p> : null}
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-700">Ver apunte</span>
      </div>
    </Link>
  );
}
