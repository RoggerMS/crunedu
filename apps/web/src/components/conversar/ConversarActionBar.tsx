"use client";

import Link from "next/link";

export function ConversarActionBar() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/app/conversar/nueva" className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700">
        Crear conversación
      </Link>
      <Link href="/app/conversar/grabaciones" className="inline-flex h-12 items-center justify-center rounded-xl border border-indigo-200 bg-white px-5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
        Ver grabaciones
      </Link>
      <Link href="/app/conversar/companeros" className="inline-flex h-12 items-center justify-center rounded-xl border border-indigo-200 bg-white px-5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
        Buscar compañeros
      </Link>
    </div>
  );
}
