import { DebateItem } from "./types";
import { SecondaryButton } from "@/components/ui";

export function DebateSummaryModal({ debate, onClose }: { debate: DebateItem | null; onClose: () => void }) {
  if (!debate) return null;
  return <div className="fixed inset-0 z-50 bg-black/30 p-4"><div className="mx-auto mt-16 max-w-xl space-y-3 rounded-2xl bg-white p-4"><h3 className="text-lg font-bold">Resumen del debate</h3><p className="text-sm"><strong>Postura A:</strong> {debate.sideA.label}</p><p className="text-sm"><strong>Postura B:</strong> {debate.sideB.label}</p><p className="text-sm text-slate-600">{debate.highlightedArguments.length ? "Conclusión neutral basada en argumentos destacados." : "El resumen estará disponible cuando haya suficientes argumentos."}</p><SecondaryButton onClick={onClose}>Cerrar</SecondaryButton></div></div>;
}
