import type { QuestionStatus } from "./types";

const styles: Record<QuestionStatus, string> = {
  sin_responder: "bg-rose-100 text-rose-700",
  respondida: "bg-emerald-100 text-emerald-700",
  resuelta: "bg-emerald-200 text-emerald-800",
  urgente: "bg-orange-100 text-orange-700",
  con_mejor_respuesta: "bg-amber-100 text-amber-700",
};
const labels: Record<QuestionStatus, string> = { sin_responder: "Sin responder", respondida: "Respondida", resuelta: "Resuelta", urgente: "Urgente", con_mejor_respuesta: "Con mejor respuesta" };

export function QuestionStatusBadge({ status }: { status: QuestionStatus }) { return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>; }
