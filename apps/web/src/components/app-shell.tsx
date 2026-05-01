"use client";

import { MAIN_NAVIGATION } from "@crunedu/shared";
import { ChevronLeft, ChevronRight, GraduationCap, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearch } from "@/hooks/useSearch";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "posts" | "questions" | "communities" | "products">("all");
  const [searchPage, setSearchPage] = useState(1);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const { results, loading, error } = useSearch(query, searchType, searchPage);
  const hasQuery = query.trim().length > 0;
  const hasResults =
    results.posts.length > 0 ||
    results.questions.length > 0 ||
    results.communities.length > 0 ||
    results.products.length > 0;

  useEffect(() => {
    setSearchPage(1);
  }, [query, searchType]);

  useEffect(() => {
    if (!hasQuery || loading || error || (results.total ?? 0) > 0 || typeof window === "undefined") {
      return;
    }

    const key = "crunedu_search_no_results_metrics";
    const current = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, number>;
    const metricKey = `${searchType}:${query.trim().toLowerCase()}`;
    const next = { ...current, [metricKey]: Number(current[metricKey] ?? 0) + 1 };
    window.localStorage.setItem(key, JSON.stringify(next));
  }, [error, hasQuery, loading, query, results.total, searchType]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedPreference = window.sessionStorage.getItem(
      "crunedu:right-panel-open",
    );

    if (storedPreference !== null) {
      setIsQuickActionsOpen(storedPreference === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      "crunedu:right-panel-open",
      String(isQuickActionsOpen),
    );
  }, [isQuickActionsOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <div className="flex h-full flex-col">
          <Link
            href="/app"
            className="flex items-center gap-3 text-2xl font-black tracking-tight"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <GraduationCap size={22} />
            </span>
            Crun<span className="-ml-3 text-indigo-600">Edu</span>
          </Link>

          <nav className="mt-8 space-y-1">
            {MAIN_NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-3">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Información legal
            </h2>
            <nav className="mt-1.5 space-y-0.5" aria-label="Enlaces legales">
              <Link
                href="/terminos"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/privacidad"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Política de privacidad
              </Link>
              <Link
                href="/cookies"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Política de cookies
              </Link>
              <Link
                href="/publicidad"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Preferencias de publicidad
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      <main className={`lg:pl-64 ${isQuickActionsOpen ? "lg:pr-72" : ""}`}>
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar publicaciones, preguntas, comunidades y productos"
                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-500"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setIsQuickActionsOpen((currentState) => !currentState)
              }
              className="ml-auto hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:inline-flex"
            >
              {isQuickActionsOpen ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
              {isQuickActionsOpen ? "Cerrar panel" : "Abrir panel"}
            </button>
          </div>

          {hasQuery ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { key: "all", label: "Todos" },
                  { key: "posts", label: "Publicaciones" },
                  { key: "questions", label: "Preguntas" },
                  { key: "communities", label: "Comunidades" },
                  { key: "products", label: "Productos" },
                ].map((tab) => (
                  <button key={tab.key} type="button" onClick={() => setSearchType(tab.key as typeof searchType)} className={`rounded-lg px-3 py-1 text-xs font-semibold ${searchType === tab.key ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              {loading ? (
                <p className="text-sm text-slate-500">Buscando resultados...</p>
              ) : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {!loading && !error && !hasResults ? (
                <p className="text-sm text-slate-600">
                  No se encontraron resultados para tu búsqueda.
                </p>
              ) : null}
              {!loading && !error && hasResults ? <p className="text-xs text-slate-500">Resultados: {results.total ?? 0}.</p> : null}
              {!loading && !error && (results.total ?? 0) > 5 ? (
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => setSearchPage((value) => Math.max(1, value - 1))} disabled={searchPage === 1} className="rounded border border-slate-300 px-2 py-1 text-xs disabled:opacity-50">Anterior</button>
                  <span className="text-xs text-slate-600">Página {searchPage}</span>
                  <button type="button" onClick={() => setSearchPage((value) => value + 1)} className="rounded border border-slate-300 px-2 py-1 text-xs">Siguiente</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        <div className="mx-auto max-w-4xl px-5 py-6">
          {children}

          <div className="mt-8 border-t border-slate-200 pt-3 lg:hidden">
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Información legal
            </h2>
            <nav
              className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1"
              aria-label="Enlaces legales móviles"
            >
              <Link
                href="/terminos"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Términos
              </Link>
              <Link
                href="/privacidad"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Privacidad
              </Link>
              <Link
                href="/cookies"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Cookies
              </Link>
              <Link
                href="/publicidad"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Publicidad
              </Link>
            </nav>
          </div>
        </div>
      </main>

      {isQuickActionsOpen ? (
        <aside className="fixed right-0 top-0 hidden h-full w-72 border-l border-slate-200 bg-white px-4 py-6 lg:block">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Acciones rápidas
          </h2>
          <div className="mt-4 space-y-2 text-sm">
            <Link
              href="/app"
              className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              Publicar en el feed
            </Link>
            <Link
              href="/app/comunidades"
              className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              Unirme a una comunidad
            </Link>
            <Link
              href="/app/preguntas"
              className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              Responder preguntas
            </Link>
            <Link
              href="/app/apuntes"
              className="block rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
            >
              Buscar apuntes
            </Link>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
