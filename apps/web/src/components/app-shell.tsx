import { MAIN_NAVIGATION } from "@crunedu/shared";
import { Bell, GraduationCap, Search, UserRound } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <Link href="/app" className="flex items-center gap-3 text-2xl font-black tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <GraduationCap size={22} />
          </span>
          Crun<span className="-ml-3 text-indigo-600">Edu</span>
        </Link>
        <p className="mt-3 text-sm leading-6 text-slate-500">Comunidad universitaria independiente.</p>
        <nav className="mt-8 space-y-1">
          {MAIN_NAVIGATION.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-3xl bg-indigo-50 p-4 text-sm text-indigo-950">
          <p className="font-bold">MVP local</p>
          <p className="mt-1 text-indigo-800">Sin dominio, sin pagos automáticos y sin vendedores externos.</p>
        </div>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">
            <Search size={16} /> Buscar publicaciones, preguntas, comunidades y productos
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-slate-100"><Bell size={20} /></button>
            <button className="rounded-full p-2 hover:bg-slate-100"><UserRound size={20} /></button>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
