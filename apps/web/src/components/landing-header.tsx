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

        <Link href={primaryHref} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white">
          Empezar
        </Link>
      </div>
    </header>
  );
}
