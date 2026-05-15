import type { Conversation } from "@/modules/conversar/types";

export function ConversarFinishedLinks({
  sharedLinks,
}: {
  sharedLinks: Conversation["sharedLinks"];
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-bold text-slate-900">Enlaces compartidos</h2>
      {sharedLinks.length ? (
        <div className="mt-3 space-y-3">
          {sharedLinks.map((link) => (
            <div
              key={link.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <p className="font-semibold text-slate-900">{link.title}</p>
              <p className="text-sm text-slate-600">
                {link.domain} · Compartido por {link.sharedBy.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Abrir
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Reportar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          No se compartieron enlaces en esta conversación.
        </p>
      )}
    </article>
  );
}
