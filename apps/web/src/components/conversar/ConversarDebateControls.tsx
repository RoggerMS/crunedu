interface Props {
  isMicEnabled: boolean;
  onToggleMic: () => void;
  onOpenShareModal: () => void;
  onOpenChangeStanceModal: () => void;
  onExit: () => void;
}

export function ConversarDebateControls({ isMicEnabled, onToggleMic, onOpenShareModal, onOpenChangeStanceModal, onExit }: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onToggleMic} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          {isMicEnabled ? "Micrófono activo" : "Micrófono silenciado"}
        </button>
        <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Pedir turno</button>
        <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Responder</button>
        <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Chat</button>
        <button type="button" onClick={onOpenChangeStanceModal} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Cambiar postura</button>
        <button type="button" onClick={onOpenShareModal} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Compartir enlace</button>
        <button type="button" onClick={onExit} className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">Salir</button>
      </div>
    </article>
  );
}
