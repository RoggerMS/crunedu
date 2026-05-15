import type { DebateStance } from "@/modules/conversar/types";

interface Props {
  stance: DebateStance;
}

export function ConversarDebateStanceColumn({ stance }: Props) {
  const members = stance.arguments.slice(0, 3).map((argument) => argument.author.name);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="text-lg font-bold text-slate-900">{stance.title}</h3>
      {stance.description ? <p className="mt-1 text-sm text-slate-600">{stance.description}</p> : null}
      <p className="mt-3 text-sm font-semibold text-slate-700">{stance.participants} participantes</p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Argumentos clave</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {stance.arguments.length ? (
            stance.arguments.map((argument) => <li key={argument.id}>• {argument.content}</li>)
          ) : (
            <li>• Todavía no hay argumentos registrados.</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Participantes simulados</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {members.length ? (
            members.map((name) => (
              <span key={`${stance.id}-${name}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {name}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">Sin participantes aún</span>
          )}
        </div>
      </div>
    </article>
  );
}
