"use client";
import { X } from "lucide-react";
import { MomentForm, type MomentFormPayload } from "./MomentForm";
import type { UploadedMomentMedia } from "@/lib/moments-api";

export function CreateMomentModal({
  onClose,
  onCreate,
  onUpload,
  submitting,
}: {
  onClose: () => void;
  onCreate: (payload: MomentFormPayload) => Promise<unknown>;
  onUpload: (file: File) => Promise<UploadedMomentMedia>;
  submitting?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Crear momento</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <MomentForm submitting={submitting} onCreate={onCreate} onUpload={onUpload} onDone={onClose} onCancel={onClose} />
      </div>
    </div>
  );
}
