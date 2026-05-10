import { Input, PrimaryButton } from "@/components/ui";
import { Plus, Search, Users, NotebookText, Layers } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateCommunity: () => void;
  stats: { communities: number; members: number; postsThisWeek: number };
};

export function CommunitiesHeader({ search, onSearchChange, onCreateCommunity, stats }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Comunidades</h1>
          <p className="mt-2 text-slate-600">Explora espacios por carrera, facultad, curso, trámite o tema.</p>
          <PrimaryButton className="mt-4" onClick={onCreateCommunity}><Plus className="h-4 w-4" />Crear comunidad</PrimaryButton>
        </div>
        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar comunidades..." className="pl-9" value={search} onChange={(e) => onSearchChange(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Layers className="h-4 w-4" />} label="comunidades" value={String(stats.communities)} />
        <StatCard icon={<Users className="h-4 w-4" />} label="miembros" value={formatCompact(stats.members)} />
        <StatCard icon={<NotebookText className="h-4 w-4" />} label="publicaciones esta semana" value={formatCompact(stats.postsThisWeek)} />
      </div>
    </section>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-800"><div className="flex items-center gap-2 text-sm">{icon}<span className="text-2xl font-bold">{value}</span></div><p className="mt-1 text-xs text-slate-500">{label}</p></div>;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}
