import Link from "next/link";
import { BadgeCheck, ShieldCheck, ShoppingBag, Users } from "lucide-react";

export function StoreHeader({ onService, onMy, onSaved, onConsultas }: { onService: () => void; onMy: () => void; onSaved: () => void; onConsultas: () => void }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 shadow-sm lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-medium text-indigo-700">Marketplace CrunEdu</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">Tienda universitaria</h1>
          <p className="mt-3 text-slate-600">Compra, vende, intercambia o encuentra servicios útiles para tu vida académica.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {[
              "Segura",
              "En campus",
              "Comunidad verificada",
              "Compra protegida",
            ].map((badge) => (
              <span key={badge} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">{badge}</span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/app/tienda/nuevo" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Publicar producto</Link>
            <button type="button" onClick={onService} className="rounded-xl border px-3 py-2 text-sm">Ofrecer servicio</button>
            <button type="button" onClick={onMy} className="rounded-xl border px-3 py-2 text-sm">Mis ventas</button>
            <button type="button" onClick={onSaved} className="rounded-xl border px-3 py-2 text-sm">Guardados</button>
            <button type="button" onClick={onConsultas} className="rounded-xl border px-3 py-2 text-sm">Mis consultas</button>
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white/90 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Compra segura en campus</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Coordina en puntos públicos.</li>
            <li className="flex gap-2"><ShoppingBag className="mt-0.5 h-4 w-4 text-indigo-600" />Usa el chat interno de CrunEdu.</li>
            <li className="flex gap-2"><Users className="mt-0.5 h-4 w-4 text-indigo-600" />Revisa reputación del vendedor.</li>
            <li className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 text-indigo-600" />Reporta publicaciones sospechosas.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
