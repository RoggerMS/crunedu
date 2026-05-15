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
  const debateConversations = mockConversations
    .filter((conversation) => conversation.type === "debate")
    .slice(0, 3);

  return (
    <aside className="space-y-4">
      <section className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Salas activas ahora</h3>
        <ul className="mt-3 space-y-3">
          {liveConversations.map((conversation) => (
            <li key={conversation.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="text-sm font-semibold text-slate-800">{conversation.title}</p>
              <p className="mt-1 text-xs text-slate-600">{formatParticipantSummary(conversation)}</p>
              <span className="mt-2 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                En vivo
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Temas populares</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {popularTopics.map((topic) => (
            <li key={topic} className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
              <p className="font-medium text-slate-700">{topic}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Estudiantes disponibles</h3>
        <ul className="mt-3 space-y-3">
          {mockCompanions.slice(0, 4).map((companion) => (
            <li key={companion.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-sm font-semibold text-slate-800">{companion.user.name}</p>
              <p className="mt-1 text-xs text-slate-600">{companion.topics[0]}</p>
              <p className="mt-1 text-xs text-slate-500">{companion.availability}</p>
              <button
                type="button"
                disabled
                className="mt-2 rounded-xl border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700"
              >
                Invitar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Conversaciones que se volvieron debate</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {debateConversations.map((conversation) => (
            <li key={conversation.id} className="rounded-2xl border border-violet-200 bg-violet-50/70 px-3 py-2">
              <p className="font-medium text-violet-800">{conversation.title}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
