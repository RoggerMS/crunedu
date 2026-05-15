import { mockCompanions, mockConversations } from "@/modules/conversar/mock-data";
import { formatParticipantSummary } from "@/modules/conversar/utils";

const popularTopics = [
  "IA en la educación",
  "Proposiciones lógicas",
  "Historia del Perú",
  "Técnicas de estudio",
  "Salud mental universitaria",
];

export function ConversarRightSidebar() {
  const liveConversations = mockConversations.filter((conversation) => conversation.status === "live");
  const debateConversations = mockConversations.filter((conversation) => conversation.type === "debate").slice(0, 3);

  return (
    <aside className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Salas activas ahora</h3>
        <ul className="mt-3 space-y-3">
          {liveConversations.map((conversation) => (
            <li key={conversation.id}>
              <p className="text-sm font-semibold text-slate-800">{conversation.title}</p>
              <p className="text-xs text-slate-600">{formatParticipantSummary(conversation)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Temas populares</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {popularTopics.map((topic) => (
            <li key={topic}>• {topic}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Estudiantes disponibles</h3>
        <ul className="mt-3 space-y-3">
          {mockCompanions.slice(0, 4).map((companion) => (
            <li key={companion.id} className="rounded-2xl border border-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-800">{companion.user.name}</p>
              <p className="text-xs text-slate-600">{companion.topics[0]}</p>
              <p className="mt-1 text-xs text-slate-500">{companion.availability}</p>
              <button type="button" disabled className="mt-2 rounded-xl border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Invitar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Conversaciones que se volvieron debate</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {debateConversations.map((conversation) => (
            <li key={conversation.id} className="rounded-2xl border border-violet-100 bg-violet-50/50 px-3 py-2">{conversation.title}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
