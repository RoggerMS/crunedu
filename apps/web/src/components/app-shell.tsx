"use client";

import { MAIN_NAVIGATION } from "@crunedu/shared";
import { GraduationCap, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSearch } from "@/hooks/useSearch";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const { results, loading, error } = useSearch(query);
  const hasQuery = query.trim().length > 0;
  const hasResults = results.posts.length > 0 || results.questions.length > 0 || results.communities.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <Link href="/app" className="flex items-center gap-3 text-2xl font-black tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <GraduationCap size={22} />
          </span>
          Crun<span className="-ml-3 text-indigo-600">Edu</span>
        </Link>

        <nav className="mt-8 space-y-1">
          {MAIN_NAVIGATION.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-64 xl:pr-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar publicaciones, preguntas y comunidades"
              className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-500"
            />
          </div>

          {hasQuery ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              {loading ? <p className="text-sm text-slate-500">Buscando resultados...</p> : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {!loading && !error && !hasResults ? <p className="text-sm text-slate-600">No se encontraron resultados para tu búsqueda.</p> : null}
            </div>
          ) : null}
        </header>

        <div className="mx-auto max-w-4xl px-5 py-6">{children}</div>
      </main>

      <aside className="fixed right-0 top-0 hidden h-full w-72 border-l border-slate-200 bg-white px-4 py-6 xl:block">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Acciones rápidas</h2>
        <div className="mt-4 space-y-2 text-sm">
          <Link href="/app" className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">Publicar en el feed</Link>
          <Link href="/app/comunidades" className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">Unirme a una comunidad</Link>
          <Link href="/app/preguntas" className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">Responder preguntas</Link>
          <Link href="/app/apuntes" className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">Buscar apuntes</Link>
        </div>
      </aside>
    </div>
  );
}
