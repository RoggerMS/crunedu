import Link from "next/link";
import { useState } from "react";
import { Search, Plus, Package, ShieldCheck } from "lucide-react";

export function StoreHeader({
  onSearch,
  q,
  onOpenPanel,
  isAuthenticated,
  isAdmin,
}: {
  onSearch: (text: string) => void;
  q: string;
  onOpenPanel: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const [input, setInput] = useState(q);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-4 text-white shadow-sm lg:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight lg:text-2xl">Tienda universitaria</h1>
          <p className="mt-0.5 text-sm text-indigo-50">
            Compra, vende e intercambia productos y servicios para tu vida académica
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 font-medium">
              <ShieldCheck className="h-3 w-3" /> Segura y verificada
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-medium">En campus</span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-medium">Sin comisiones</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/tienda/nuevo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Publicar
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={onOpenPanel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20 transition"
            >
              <Package className="h-3.5 w-3.5" /> Mi panel
            </button>
          )}
          {isAdmin && (
            <Link
              href="/app/admin/tienda"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500/20 px-3 py-2 text-xs font-semibold hover:bg-amber-500/30 transition"
            >
              Admin tienda
            </Link>
          )}
        </div>
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(input.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar calculadora, libros, servicios..."
            className="w-full rounded-lg border-0 bg-white/95 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}
