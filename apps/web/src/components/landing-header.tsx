"use client";

import Link from "next/link";
import { useAccessToken } from "@/hooks/useAccessToken";

export function LandingHeader() {
  const { isAuthenticated } = useAccessToken();
  const primaryHref = isAuthenticated ? "/app" : "/login";

  return (
    <header className="mx-auto w-full max-w-6xl px-6 py-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-950">
          Crun<span className="text-indigo-600">Edu</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#vision">Visión</a>
          <a href="#modulos">Módulos</a>
          <a href="#tienda">Tienda</a>
          <div className="flex flex-col items-end">
            <Link href={primaryHref} className="rounded-full bg-slate-950 px-4 py-2 text-white">
              Empezar
            </Link>
            <p className="mt-1 text-xs text-slate-500">Verás el acceso a la comunidad y al feed principal.</p>
          </div>
        </nav>
      </div>

      <div className="mt-4 flex flex-col gap-2 md:hidden">
        <Link href={primaryHref} className="w-full rounded-full bg-slate-950 px-4 py-2 text-center text-sm font-bold text-white">
          Empezar
        </Link>
        <p className="text-center text-xs text-slate-500">Verás el acceso a la comunidad y al feed principal.</p>
      </div>
    </header>
  );
}
