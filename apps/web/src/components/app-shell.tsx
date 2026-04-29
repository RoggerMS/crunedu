"use client";

import { MAIN_NAVIGATION } from "@crunedu/shared";
import { Bell, GraduationCap, Search, UserRound } from "lucide-react";
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
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-500">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar publicaciones, preguntas y comunidades"
                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full p-2 hover:bg-slate-100"><Bell size={20} /></button>
              <button className="rounded-full p-2 hover:bg-slate-100"><UserRound size={20} /></button>
            </div>
          </div>

          {hasQuery ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
              {loading ? <p className="text-sm text-slate-500">Buscando resultados...</p> : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {!loading && !error && !hasResults ? <p className="text-sm text-slate-600">No se encontraron resultados para tu búsqueda.</p> : null}

              {!loading && !error && hasResults ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <section>
                    <h3 className="text-sm font-bold text-slate-700">Publicaciones</h3>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {results.posts.map((post) => (
                        <li key={post.id} className="rounded-xl bg-slate-50 p-2">
                          <p className="font-semibold text-slate-800">{post.title || "Sin título"}</p>
                          <p className="truncate">{post.content}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-slate-700">Preguntas</h3>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {results.questions.map((question) => (
                        <li key={question.id} className="rounded-xl bg-slate-50 p-2">
                          <p className="font-semibold text-slate-800">{question.title}</p>
                          <p className="truncate">{question.content}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold text-slate-700">Comunidades</h3>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {results.communities.map((community) => (
                        <li key={community.id} className="rounded-xl bg-slate-50 p-2">
                          <p className="font-semibold text-slate-800">{community.name}</p>
                          <p className="truncate">{community.description ?? "Sin descripción"}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : null}
            </div>
          ) : null}
        </header>
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
