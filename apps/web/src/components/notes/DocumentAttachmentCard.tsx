import Link from "next/link";
import { FileText, Image as ImageIcon, Archive, FileType2, Sheet, Presentation } from "lucide-react";
import type { NoteFileType } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

const TYPE_ICON: Record<NoteFileType, typeof FileText> = {
  pdf: FileText,
  word: FileType2,
  image: ImageIcon,
  zip: Archive,
  ppt: Presentation,
  excel: Sheet,
  other: FileText,
};

const TYPE_GRADIENT: Record<NoteFileType, string> = {
  pdf: "from-rose-50 to-rose-100",
  word: "from-blue-50 to-blue-100",
  image: "from-emerald-50 to-emerald-100",
  zip: "from-amber-50 to-amber-100",
  ppt: "from-orange-50 to-orange-100",
  excel: "from-green-50 to-green-100",
  other: "from-slate-50 to-slate-100",
};

type DocumentAttachmentCardProps = {
  id: string | number;
  title: string;
  fileType: NoteFileType;
  sizeBytes?: number;
  course?: string | null;
  description?: string | null;
};

export function DocumentAttachmentCard({ id, title, fileType, sizeBytes, course, description }: DocumentAttachmentCardProps) {
  const Icon = TYPE_ICON[fileType] ?? FileText;
  return (
    <Link href={`/app/apuntes/${id}`} className="block overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm">
      {/* Mini preview banner */}
      <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${TYPE_GRADIENT[fileType]}`}>
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <DocumentFileIcon fileType={fileType} />
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {course ? course : "Apunte"}
          {sizeBytes ? ` · ${formatSize(sizeBytes)}` : ""}
        </p>
        {description ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{description}</p> : null}
        <span className="mt-2 inline-block rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">Ver apunte</span>
      </div>
    </Link>
  );
}
