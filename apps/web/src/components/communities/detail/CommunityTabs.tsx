const baseTabs = ["inicio", "publicaciones", "miembros", "eventos", "archivos", "informacion"] as const;

type Props = {
  activeTab: string;
  onChange: (tab: string) => void;
  showSettings: boolean;
};

export function CommunityTabs({ activeTab, onChange, showSettings }: Props) {
  const tabs = showSettings ? [...baseTabs, "configuracion"] : [...baseTabs];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => onChange(tab)} className={`border-b-2 px-3 py-3 text-sm font-semibold whitespace-nowrap ${activeTab === tab ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
            {label(tab)}
          </button>
        ))}
      </div>
    </div>
  );
}

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
