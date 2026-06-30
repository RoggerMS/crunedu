"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

export function ConversarSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex gap-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversarError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <AlertCircle className="mx-auto mb-2 text-rose-600" size={28} />
      <p className="text-sm font-medium text-rose-800">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          <RefreshCw size={16} /> Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function ConversarEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Loader2 className="text-slate-400" size={24} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ConversarLoadingInline({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
      <Loader2 className="animate-spin" size={16} /> {label ?? "Cargando..."}
    </div>
  );
}
