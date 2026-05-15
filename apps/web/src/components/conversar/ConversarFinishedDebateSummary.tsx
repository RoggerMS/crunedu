import type { Conversation } from "@/modules/conversar/types";

export function ConversarFinishedDebateSummary({
  debateStances,
}: {
  debateStances: Conversation["debateStances"];
}) {
  if (!debateStances?.length) return null;

  return (
    <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-soft">
      <h2 className="text-lg font-bold text-violet-900">Posturas del debate</h2>
      <div className="mt-3 space-y-3">
        {debateStances.map((stance) => (
          <div
            key={stance.id}
            className="rounded-2xl border border-violet-200 bg-white p-3"
          >
            <h3 className="font-semibold text-slate-900">{stance.title}</h3>
            {stance.description ? (
              <p className="mt-1 text-sm text-slate-700">
                {stance.description}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-slate-600">
              Participantes: {stance.participants}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-violet-700">
              Argumentos destacados
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {stance.arguments.map((argument) => (
                <li key={argument.id}>{argument.content}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
