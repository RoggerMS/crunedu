import Link from "next/link";

interface Props {
  isMicEnabled: boolean;
  onToggleMic: () => void;
  onOpenShareModal: () => void;
}

export function ConversarRoomControls({ isMicEnabled, onToggleMic, onOpenShareModal }: Props) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <button type="button" onClick={onToggleMic} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
        {isMicEnabled ? "Micrófono activo" : "Micrófono silenciado"}
      </button>
      <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Levantar mano</button>
      <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Chat</button>
      <button type="button" onClick={onOpenShareModal} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Compartir enlace</button>
      <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Más</button>
      <Link href="/app/conversar" className="rounded-xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">Salir</Link>
    </div>
  );
}
