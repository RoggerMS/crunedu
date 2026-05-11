import Link from "next/link";
import { BadgeCheck, GraduationCap, ShieldCheck, ShoppingBag, Sparkles, Users } from "lucide-react";

export function StoreHeader({ onService, onMy, onSaved, onConsultas }: { onService: () => void; onMy: () => void; onSaved: () => void; onConsultas: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-4 text-white shadow-sm lg:p-5">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute bottom-0 right-24 h-24 w-24 rounded-full bg-indigo-300/30" />
      <div className="grid min-h-[180px] gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Marketplace CrunEdu
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight lg:text-3xl">Tienda universitaria</h1>
            <p className="mt-1 text-sm text-indigo-50">Compra, vende y encuentra oportunidades útiles para tu vida académica.</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/app/tienda/nuevo" className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Publicar producto</Link>
            <button type="button" onClick={onService} className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold">Ofrecer servicio</button>
            <button type="button" onClick={onMy} className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold">Mis ventas</button>
            <button type="button" onClick={onSaved} className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold">Guardados</button>
            <button type="button" onClick={onConsultas} className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold">Mis consultas</button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {["Segura", "En campus", "Comunidad verificada", "Compra protegida"].map((badge) => (
              <span key={badge} className="rounded-full bg-white/15 px-2.5 py-1 font-medium text-white/95">{badge}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-white/95 p-3 text-slate-700">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Compra segura en campus</h3>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-indigo-600" />Coordina en puntos públicos.</li>
              <li className="flex gap-2"><ShoppingBag className="mt-0.5 h-3.5 w-3.5 text-indigo-600" />Usa el chat interno.</li>
              <li className="flex gap-2"><Users className="mt-0.5 h-3.5 w-3.5 text-indigo-600" />Revisa reputación.</li>
              <li className="flex gap-2"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 text-indigo-600" />Reporta sospechas.</li>
            </ul>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-50 px-2.5 py-2 text-xs text-indigo-700">
            <GraduationCap className="h-4 w-4" />
            Comunidad académica con foco en campus.
          </div>
        </div>
      </div>
    </div>
  );
}
