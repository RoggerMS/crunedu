import Link from "next/link";
import type { Conversation } from "@/modules/conversar/types";

type Props = {
  relatedConversations: Conversation[];
  topicRecommendations: string[];
  availableRecordings: Conversation[];
};
export function ConversarFinishedRightRail({
  relatedConversations,
  topicRecommendations,
  availableRecordings,
}: Props) {
  return (
    <aside className="space-y-4">
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">
          Conversaciones relacionadas
        </h3>
        <div className="mt-3 space-y-2">
          {relatedConversations.length ? (
            relatedConversations.map((item) => (
              <Link
                key={item.id}
                href={`/app/conversar/${item.id}`}
                className="block rounded-xl border border-slate-200 p-3 text-sm hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.type}</p>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-600">
              No hay conversaciones relacionadas por ahora.
            </p>
          )}
        </div>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Temas recomendados</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {topicRecommendations.map((topic) => (
            <li key={topic} className="rounded-xl bg-slate-100 px-3 py-2">
              {topic}
            </li>
          ))}
        </ul>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">
          También podrías escuchar
        </h3>
        <div className="mt-3 space-y-2">
          {availableRecordings.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 p-3"
            >
              <p className="text-sm font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="text-xs text-slate-600">
                {item.recording?.durationLabel ?? "Duración no disponible"}
              </p>
              <Link
                href={`/app/conversar/${item.id}/finalizada`}
                className="mt-2 inline-block rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Ver grabación
              </Link>
            </div>
          ))}
        </div>
      </article>
    </aside>
  );
}
