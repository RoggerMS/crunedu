"use client";

import { MAIN_NAVIGATION } from "@crunedu/shared";
import { Bell, ChevronLeft, ChevronRight, GraduationCap, Search, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useSearch } from "@/hooks/useSearch";

function isNavActive(itemHref: string, pathname: string) {
  if (itemHref === "/app") return pathname === "/app";
  if (itemHref === "/app/universidad") {
    return pathname.startsWith("/app/universidad") || pathname.startsWith("/app/tramites");
  }
  return pathname.startsWith(itemHref);
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, setAccessToken } = useAccessToken();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [searchType, setSearchType] = useState<"all" | "posts" | "questions" | "communities" | "products">("all");
  const [searchPage, setSearchPage] = useState(1);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const searchContext = useMemo(() => getSearchContext(pathname), [pathname]);
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
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalizedQuery = query.trim();
      if (normalizedQuery.length > 0) {
        params.set("q", normalizedQuery);
      } else {
        params.delete("q");
      }
      const target = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(target, { scroll: false });
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, query, router, searchParams]);

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

  function handleLogout() {
    setAccessToken("");
    router.replace("/login");
  }

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
            {MAIN_NAVIGATION.map((item) => {
              const active = isNavActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cerrar sesión
              </button>
            ) : null}
            <h2 className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Información legal
            </h2>
            <nav className="mt-1.5 space-y-0.5" aria-label="Enlaces legales">
              <Link
                href="/legal/terminos"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Términos y condiciones
              </Link>
              <Link
                href="/legal/politica-privacidad"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Política de privacidad
              </Link>
              <Link
                href="/legal/politica-cookies"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Política de cookies
              </Link>
              <Link
                href="/legal/preferencias-publicidad"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Preferencias de publicidad
              </Link>
              <Link
                href="/legal/normas-comunidad"
                className="block rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Normas de comunidad
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
                placeholder={searchContext.placeholder}
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
            <Link
              href="/app/notificaciones"
              className="hidden shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 lg:inline-flex"
              aria-label="Abrir notificaciones"
            >
              <Bell size={18} />
            </Link>
            <Link
              href="/app/perfil"
              className="hidden shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 lg:inline-flex"
              aria-label="Ir a perfil"
            >
              <UserCircle2 size={18} />
            </Link>
          </div>

          {hasQuery && searchContext.scope === "all" ? (
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

        <div className="mx-auto max-w-[1540px] px-5 py-6">
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
                href="/legal/terminos"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Términos
              </Link>
              <Link
                href="/legal/politica-privacidad"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Privacidad
              </Link>
              <Link
                href="/legal/politica-cookies"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Cookies
              </Link>
              <Link
                href="/legal/preferencias-publicidad"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Publicidad
              </Link>
              <Link
                href="/legal/normas-comunidad"
                className="rounded-sm text-[11px] text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Normas
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

function getSearchContext(pathname: string): { scope: "all" | "questions" | "debates" | "communities" | "notes" | "procedures" | "moments" | "store"; placeholder: string } {
  if (pathname.startsWith("/app/preguntas")) return { scope: "questions", placeholder: "Buscar preguntas, cursos, ejercicios o temas..." };
  if (pathname.startsWith("/app/debates")) return { scope: "debates", placeholder: "Buscar debates, cursos, temas o participantes..." };
  if (pathname.startsWith("/app/comunidades")) return { scope: "communities", placeholder: "Buscar comunidades, carreras, cursos o temas..." };
  if (pathname.startsWith("/app/apuntes")) return { scope: "notes", placeholder: "Buscar apuntes, materiales, cursos o archivos..." };
  if (pathname.startsWith("/app/tramites") || pathname.startsWith("/app/universidad")) return { scope: "procedures", placeholder: "Buscar avisos, trámites, eventos o servicios..." };
  if (pathname.startsWith("/app/momentos")) return { scope: "moments", placeholder: "Buscar momentos, experiencias o publicaciones destacadas..." };
  if (pathname.startsWith("/app/tienda")) return { scope: "store", placeholder: "Buscar productos, recursos o materiales..." };
  return { scope: "all", placeholder: "Buscar publicaciones, preguntas, comunidades y productos..." };
}
