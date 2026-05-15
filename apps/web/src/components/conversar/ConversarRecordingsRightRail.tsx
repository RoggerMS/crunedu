import type { Conversation } from "@/modules/conversar/types";

type Props = {
  mostPlayed: Conversation[];
  featuredCreators: Conversation["createdBy"][];
};

export function ConversarRecordingsRightRail({
  mostPlayed,
  featuredCreators,
}: Props) {
  return (
    <aside className="space-y-4">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-base font-bold text-slate-900">
          Más reproducidas esta semana
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {mostPlayed.map((conversation) => (
            <li
              key={conversation.id}
              className="rounded-2xl bg-slate-50 px-3 py-2"
            >
              {conversation.title} · {conversation.recording?.plays ?? 0}{" "}
              reproducciones
            </li>
          ))}
        </ul>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-base font-bold text-slate-900">Temas populares</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {[
            "Lógica",
            "Historia del Perú",
            "Métodos de estudio",
            "IA y educación",
            "Argumentación",
          ].map((topicItem) => (
            <li key={topicItem} className="rounded-2xl bg-slate-50 px-3 py-2">
              {topicItem}
            </li>
          ))}
        </ul>
      </article>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-base font-bold text-slate-900">
          Creadores destacados
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {featuredCreators.map((creator) => (
            <li key={creator.id} className="rounded-2xl bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">{creator.name}</p>
              <p className="text-xs text-slate-500">
                {creator.career ?? creator.university ?? "La Cantuta"}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </aside>
  );
}
