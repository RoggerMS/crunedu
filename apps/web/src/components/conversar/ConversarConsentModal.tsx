interface Props {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}
export function ConversarConsentModal({ open, onClose, onAccept }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">
          Esta conversación será grabada
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Al activar tu micrófono aceptas que tu voz quede registrada según las
          normas de CrunEdu.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Entrar solo como oyente
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Acepto y activar micrófono
          </button>
        </div>
      </div>
    </div>
  );
}
