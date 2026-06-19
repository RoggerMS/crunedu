"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Archive, FileType2, Sheet, Presentation } from "lucide-react";
import type { NoteFile, NoteFileType } from "./types";
import { DocumentFileIcon } from "./DocumentFileIcon";
import { formatSize } from "./NoteFilePreview";

type NotePreviewProps = {
  file: NoteFile;
  mode: "card" | "detail";
};

const TYPE_ICON: Record<NoteFileType, typeof FileText> = {
  pdf: FileText,
  word: FileType2,
  image: ImageIcon,
  zip: Archive,
  ppt: Presentation,
  excel: Sheet,
  other: FileText,
};

function useInView(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

function PlaceholderCard({ fileType, label }: { fileType: NoteFileType; label: string }) {
  const Icon = TYPE_ICON[fileType] ?? FileText;
  const gradients: Record<NoteFileType, string> = {
    pdf: "from-rose-50 to-rose-100",
    word: "from-blue-50 to-blue-100",
    image: "from-emerald-50 to-emerald-100",
    zip: "from-amber-50 to-amber-100",
    ppt: "from-orange-50 to-orange-100",
    excel: "from-green-50 to-green-100",
    other: "from-slate-50 to-slate-100",
  };
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradients[fileType]}`}>
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <Icon className="h-8 w-8" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100">
      <div className="text-xs text-slate-400">Cargando preview…</div>
    </div>
  );
}

function PdfObjectPreview({ url, height }: { url: string; height: string }) {
  const { ref, inView } = useInView("300px");
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-xl" style={{ height }}>
      {inView ? (
        <object data={`${url}#toolbar=0&navpanes=0&view=FitH`} type="application/pdf" className="h-full w-full" aria-label="Vista previa del PDF">
          <div className="flex h-full w-full items-center justify-center bg-slate-50">
            <div className="text-center">
              <FileText className="mx-auto h-8 w-8 text-rose-400" />
              <p className="mt-1 text-xs text-slate-500">Tu navegador no puede mostrar el PDF.</p>
            </div>
          </div>
        </object>
      ) : (
        <LoadingPlaceholder />
      )}
    </div>
  );
}

function PdfIframeViewer({ url, title }: { url: string; title: string }) {
  const { ref, inView } = useInView("400px");
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-xl border border-slate-200" style={{ height: "600px" }}>
      {inView ? (
        <iframe
          src={`${url}#view=FitH`}
          className="h-full w-full"
          title={`Visor PDF: ${title}`}
          aria-label={`Visor PDF: ${title}`}
        />
      ) : (
        <LoadingPlaceholder />
      )}
    </div>
  );
}

function ImagePreview({ url, height, alt, mode }: { url: string; height: string; alt: string; mode: "card" | "detail" }) {
  const { ref, inView } = useInView("300px");
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-full overflow-hidden rounded-xl" style={{ height }}>
        <PlaceholderCard fileType="image" label="Imagen no disponible" />
      </div>
    );
  }

  if (mode === "card") {
    return (
      <div ref={ref} className="w-full overflow-hidden rounded-xl bg-slate-100" style={{ height }}>
        {inView ? (
          <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" onError={() => setErrored(true)} />
        ) : (
          <LoadingPlaceholder />
        )}
      </div>
    );
  }
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50" style={{ maxHeight: height }}>
      {inView ? (
        <img src={url} alt={alt} className="mx-auto max-h-[600px] w-auto max-w-full object-contain" loading="lazy" onError={() => setErrored(true)} />
      ) : (
        <LoadingPlaceholder />
      )}
    </div>
  );
}

function FileCardPreview({ file, height }: { file: NoteFile; height: string }) {
  return (
    <div className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100" style={{ height }}>
      <div className="flex flex-col items-center gap-2 text-center">
        <DocumentFileIcon fileType={file.fileType} size="md" />
        <p className="max-w-[80%] truncate text-xs font-medium text-slate-700">{file.name}</p>
        <p className="text-[11px] text-slate-400">{formatSize(file.size)}</p>
      </div>
    </div>
  );
}

export function NotePreview({ file, mode }: NotePreviewProps) {
  const height = mode === "card" ? "160px" : "600px";

  if (file.fileType === "pdf") {
    return mode === "card" ? (
      <PdfObjectPreview url={file.url} height={height} />
    ) : (
      <PdfIframeViewer url={file.url} title={file.name} />
    );
  }

  if (file.fileType === "image") {
    return <ImagePreview url={file.url} height={height} alt={file.name} mode={mode} />;
  }

  return <FileCardPreview file={file} height={height} />;
}
