"use client";

import { MAIN_NAVIGATION } from "@crunedu/shared";
import { ChevronLeft, ChevronRight, GraduationCap, LogOut, Plus, Search, Settings, ShieldCheck, UserCircle2, UserPen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { buildLoginHref, isAppAuthRequired } from "@/lib/auth-routes";
import { useSearch } from "@/hooks/useSearch";
import { ConversarInternalSidebar } from "@/components/conversar/ConversarInternalSidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { getAvatarInitials } from "@/components/UserIdentityLink";

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
  const { isAuthenticated, logout, user } = useAuth();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [searchType, setSearchType] = useState<"all" | "posts" | "questions" | "communities" | "products">("all");
  const [searchPage, setSearchPage] = useState(1);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const searchContext = useMemo(() => getSearchContext(pathname), [pathname]);
  const isMomentsPortal = pathname.startsWith("/app/momentos");
  const isStoreRoute = pathname.startsWith("/app/tienda");
  const isConversarRoute = pathname.startsWith("/app/conversar");
  const isStoreCreateRoute = pathname === "/app/tienda/nuevo";
  const isNewCommunityCreationRoute = pathname === "/app/comunidades/nueva";
  const { results, loading, error } = useSearch(query, searchType, searchPage);
  const currentRoute = useMemo(() => {
    const params = searchParams.toString();
    return params ? `${pathname}?${params}` : pathname;
  }, [pathname, searchParams]);
  const loginHref = useMemo(() => buildLoginHref(currentRoute), [currentRoute]);
  const requireAuthForAppRoutes = isAppAuthRequired();
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

  useEffect(() => {
    if (!isAvatarMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAvatarMenuOpen]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (isMomentsPortal || isNewCommunityCreationRoute) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        {isConversarRoute ? (
          <ConversarInternalSidebar />
        ) : (
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
              <Link
                href="/app/configuracion-perfil"
                className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Settings size={16} />
                Configuración
              </Link>
            ) : null}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cerrar sesión
              </button>
            ) : (
              <Link
                href={loginHref}
                data-private-mode-ready={requireAuthForAppRoutes ? "true" : "false"}
                className="mb-3 block w-full rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Iniciar sesión
              </Link>
            )}
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
        )}
      </aside>

      <main className={`pb-20 lg:pb-0 lg:pl-64 ${isQuickActionsOpen ? "lg:pr-72" : ""}`}>
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
            {isStoreRoute ? (
              <Link
                href={isStoreCreateRoute ? "/app/tienda" : "/app/tienda/nuevo"}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={16} />
                {isStoreCreateRoute ? "Volver a Tienda" : "Subir producto"}
              </Link>
            ) : null}

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
            {isAuthenticated ? <NotificationsPopover /> : null}
            {!isAuthenticated ? (
              <Link
                href={loginHref}
                className="inline-flex shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Iniciar sesión
              </Link>
            ) : null}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={avatarMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAvatarMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-indigo-100 text-sm font-bold text-indigo-700 transition hover:border-indigo-400"
                  aria-label="Menú de usuario"
                  aria-expanded={isAvatarMenuOpen}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="h-full w-full object-cover" />
                  ) : (
                    getAvatarInitials(`${user.firstName} ${user.lastName}`)
                  )}
                </button>
                {isAvatarMenuOpen ? (
                  <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="truncate text-sm font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link href="/app/perfil" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <UserCircle2 size={16} /> Ver mi perfil
                    </Link>
                    <Link href="/app/configuracion-perfil" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <UserPen size={16} /> Editar perfil
                    </Link>
                    <Link href="/app/configuracion-perfil" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Settings size={16} /> Configuración
                    </Link>
                    {user.role === "ADMIN" ? (
                      <Link href="/app/admin" onClick={() => setIsAvatarMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
                        <ShieldCheck size={16} /> Administración
                      </Link>
                    ) : null}
                    <button type="button" onClick={() => { setIsAvatarMenuOpen(false); handleLogout(); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
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
              {!loading && !error && hasResults ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Resultados: {results.total ?? 0}.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {results.posts.map((item) => <Link key={`post-${item.id}`} href={`/app?post=${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><span className="block font-semibold text-slate-900">{item.title || "PublicaciÃ³n"}</span><span className="line-clamp-1 text-xs text-slate-500">{item.content}</span></Link>)}
                    {results.questions.map((item) => <Link key={`question-${item.id}`} href={`/app/preguntas/${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><span className="block font-semibold text-slate-900">{item.title}</span><span className="line-clamp-1 text-xs text-slate-500">Pregunta</span></Link>)}
                    {results.communities.map((item) => <Link key={`community-${item.id}`} href={`/app/comunidades/${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><span className="block font-semibold text-slate-900">{item.name}</span><span className="line-clamp-1 text-xs text-slate-500">{item.description || "Comunidad estudiantil"}</span></Link>)}
                    {results.products.map((item) => <Link key={`product-${item.id}`} href={`/app/tienda/${item.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"><span className="block font-semibold text-slate-900">{item.title}</span><span className="line-clamp-1 text-xs text-slate-500">Producto de CrunEdu</span></Link>)}
                  </div>
                </div>
              ) : null}
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
      <MobileBottomNav />
    </div>
  );
}

function getSearchContext(pathname: string): { scope: "all" | "questions" | "debates" | "conversar" | "communities" | "notes" | "procedures" | "moments" | "store"; placeholder: string } {
  if (pathname.startsWith("/app/preguntas")) return { scope: "questions", placeholder: "Buscar preguntas, cursos, ejercicios o temas..." };
  if (pathname.startsWith("/app/debates")) return { scope: "debates", placeholder: "Buscar debates, cursos, temas o participantes..." };
  if (pathname.startsWith("/app/conversar")) return { scope: "conversar", placeholder: "Buscar conversaciones, temas, cursos o estudiantes..." };
  if (pathname.startsWith("/app/comunidades")) return { scope: "communities", placeholder: "Buscar comunidades, carreras, cursos o temas..." };
  if (pathname.startsWith("/app/apuntes")) return { scope: "notes", placeholder: "Buscar apuntes, materiales, cursos o archivos..." };
  if (pathname.startsWith("/app/tramites") || pathname.startsWith("/app/universidad")) return { scope: "procedures", placeholder: "Buscar avisos, trámites, eventos o servicios..." };
  if (pathname.startsWith("/app/momentos")) return { scope: "moments", placeholder: "Buscar momentos, experiencias o publicaciones destacadas..." };
  if (pathname.startsWith("/app/tienda")) return { scope: "store", placeholder: "¿Qué necesitas para tus clases o tu vida en campus?" };
  return { scope: "all", placeholder: "Buscar publicaciones, preguntas, comunidades y productos..." };
}
