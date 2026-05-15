import { useMemo, useState } from "react";
import type { Conversation, DebateStance } from "@/modules/conversar/types";

type TabKey = "chat" | "participants" | "arguments" | "links" | "materials";

const tabs: { key: TabKey; label: string }[] = [
  { key: "chat", label: "Chat" },
  { key: "participants", label: "Participantes" },
  { key: "arguments", label: "Argumentos" },
  { key: "links", label: "Enlaces" },
  { key: "materials", label: "Materiales" },
];

const mockChat = [
  "Diego: Creo que depende de cómo el docente guía el uso de IA.",
  "Valeria: A favor si se usa para explorar ideas, no para copiar.",
  "José: En contra cuando reemplaza el razonamiento propio.",
  "Lucía: La evaluación debería enfocarse en el proceso, no solo en la respuesta.",
];

export function ConversarDebateSidePanel({
  conversation,
  stances,
}: {
  conversation: Conversation;
  stances: DebateStance[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  const grouped = useMemo(() => {
    const result: Record<string, string[]> = {
      "A favor": [],
      "En contra": [],
      "Depende del uso": [],
      Oyentes: [],
    };

    conversation.participants.forEach((participant, index) => {
      if (participant.status === "listening") {
        result.Oyentes.push(participant.user.name);
        return;
      }

      const target = index % 3;
      if (target === 0) result["A favor"].push(participant.user.name);
      if (target === 1) result["En contra"].push(participant.user.name);
      if (target === 2) result["Depende del uso"].push(participant.user.name);
    });

    return result;
  }, [conversation.participants]);

  return (
    <aside className="space-y-4">
      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-slate-700">
          {activeTab === "chat" ? (
            <ul className="space-y-2">
              {mockChat.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          ) : null}

          {activeTab === "participants" ? (
            <div className="space-y-3">
              {Object.entries(grouped).map(([label, names]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {names.length ? names.join(", ") : "Sin participantes"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "arguments" ? (
            <div className="space-y-3">
              {stances.map((stance) => (
                <div key={stance.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stance.title}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {stance.arguments.map((argument) => (
                      <li key={argument.id}>• {argument.content}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "links" ? (
            <div className="space-y-3">
              {conversation.sharedLinks.length ? (
                conversation.sharedLinks.map((link) => (
                  <article
                    key={link.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <p className="font-semibold text-slate-900">{link.title}</p>
                    <p className="text-xs text-slate-500">
                      {link.domain} · compartido por {link.sharedBy.name}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        Reportar
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p>No hay enlaces compartidos.</p>
              )}
            </div>
          ) : null}

          {activeTab === "materials" ? (
            <div className="space-y-3">
              {conversation.materials.length ? (
                conversation.materials.map((material) => (
                  <article
                    key={material.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <p className="font-semibold text-slate-900">
                      {material.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {material.type.toUpperCase()}
                      {material.size ? ` · ${material.size}` : ""}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p>No hay materiales compartidos.</p>
              )}
            </div>
          ) : null}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900">Reglas del debate</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-600">
          <li>Respeta las opiniones.</li>
          <li>Habla por turnos.</li>
          <li>Argumenta con razones.</li>
          <li>Evita ataques personales.</li>
          <li>Puedes cambiar de postura si una idea te convence.</li>
        </ol>
      </article>
    </aside>
  );
}
