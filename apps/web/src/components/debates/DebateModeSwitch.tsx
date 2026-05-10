import { DebateMode } from "./types";

export function DebateModeSwitch({ mode, onChange }: { mode: DebateMode; onChange: (mode: DebateMode) => void }) {
  return <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2">{(["academicos", "generales"] as DebateMode[]).map((item) => <button key={item} onClick={() => onChange(item)} className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === item ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{item === "academicos" ? "Académicos" : "Generales"}</button>)}</div>;
}
