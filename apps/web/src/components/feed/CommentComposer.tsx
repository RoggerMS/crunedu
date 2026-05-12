import { Send } from "lucide-react";

type CommentComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
};

export function CommentComposer({ value, onChange, onSubmit, placeholder }: CommentComposerProps) {
  return <div className="flex items-center gap-2 border-t bg-white px-4 py-3">
    <div className="h-8 w-8 rounded-full bg-indigo-100 text-center text-xs font-semibold leading-8 text-indigo-700">Tú</div>
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
    <button disabled={!value.trim()} onClick={onSubmit} className="rounded-xl bg-indigo-600 px-3 py-2 text-white disabled:bg-slate-300"><Send size={15} /></button>
  </div>;
}
