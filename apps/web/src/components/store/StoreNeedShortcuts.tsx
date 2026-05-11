import { storeNeeds } from "./store-data";

export function StoreNeedShortcuts({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {storeNeeds.map((need) => {
        const isActive = active === need.id;

        return (
          <button
            key={need.id}
            type="button"
            onClick={() => onSelect(need.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              isActive
                ? "border-indigo-400 bg-indigo-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">{need.icon}</div>
            <p className="text-sm font-semibold text-slate-900">{need.label}</p>
            <p className="text-xs text-slate-600">{need.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
