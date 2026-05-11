import { storeNeeds } from "./store-data";

export function StoreNeedShortcuts({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-10">
      {storeNeeds.map((need) => {
        const isActive = active === need.id;

        return (
          <button
            key={need.id}
            type="button"
            onClick={() => onSelect(need.id)}
            className={`h-[96px] rounded-xl border p-3 text-left transition ${
              isActive
                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
            }`}
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base">{need.icon}</div>
            <p className="line-clamp-2 text-xs font-bold leading-tight text-slate-900 sm:text-sm">{need.label}</p>
            <p className="line-clamp-2 text-xs leading-tight text-slate-600">{need.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
