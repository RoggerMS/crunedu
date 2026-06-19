import { useState } from "react";
import { Flag, X } from "lucide-react";
import { STORE_REPORT_REASONS } from "./store-data";

export function StoreReportModal({
  productId,
  onReport,
  onClose,
}: {
  productId: string;
  onReport: (productId: string, reason: string, description?: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!reason) return;
    setSending(true);
    await onReport(productId, reason, description.trim() || undefined);
    setSending(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Flag className="h-5 w-5 text-rose-600" />
            Reportar producto
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-semibold">Motivo del reporte</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              required
            >
              <option value="">Selecciona un motivo</option>
              {STORE_REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Descripción adicional (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agrega más detalles sobre el reporte..."
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              maxLength={1000}
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!reason || sending}
            className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>
      </div>
    </div>
  );
}
