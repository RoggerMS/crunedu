import type { ConversationType } from "@/modules/conversar/types";

const keyIdeas = [
  "Se aclararon los puntos principales del tema.",
  "Los participantes compartieron ejemplos y recursos.",
  "Quedaron materiales disponibles para revisar después.",
  "La conversación puede retomarse en una nueva sesión relacionada.",
];

export function ConversarFinishedSummary({
  conversationType,
}: {
  conversationType: ConversationType;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-900">
        Resumen de la conversación
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        {getSummaryByType(conversationType)}
      </p>
      <h3 className="mt-4 text-sm font-bold text-slate-900">Ideas clave</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {keyIdeas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </article>
  );
}

function getSummaryByType(type: ConversationType) {
  if (type === "study" || type === "question")
    return "Durante la sesión se explicó el tema principal, se resolvieron dudas y se compartieron ejemplos para reforzar la comprensión.";
  if (type === "debate")
    return "Durante el debate se organizaron posturas, argumentos y respuestas entre los participantes.";
  return "Durante la conversación se compartieron ideas, puntos de vista y recursos relacionados con el tema.";
}
