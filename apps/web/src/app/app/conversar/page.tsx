import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { ConversarConversationCard } from "@/components/conversar/ConversarConversationCard";
import { ConversarFilters } from "@/components/conversar/ConversarFilters";
import { ConversarRightSidebar } from "@/components/conversar/ConversarRightSidebar";
import { mockConversations } from "@/modules/conversar/mock-data";

const tabs = ["Todos", "Académicos", "Generales", "En vivo ahora", "Grabaciones"];

export default function ConversarPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Conversar</h1>
            <p className="text-sm text-slate-600 sm:text-base">
              Encuentra estudiantes para hablar, estudiar, resolver dudas o compartir ideas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" disabled>
              Crear conversación
            </PrimaryButton>
            <SecondaryButton type="button" disabled>
              Buscar compañeros
            </SecondaryButton>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              index === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
            disabled
          >
            {tab}
          </button>
        ))}
      </div>

      <ConversarFilters />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          {mockConversations.map((conversation) => (
            <ConversarConversationCard key={conversation.id} conversation={conversation} />
          ))}
        </main>
        <ConversarRightSidebar />
      </div>
    </section>
  );
}
