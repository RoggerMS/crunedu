import type { ReactNode } from "react";

type StoreSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
};

export function StoreSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: StoreSectionProps) {
  return (
    <section className="min-w-0 space-y-2.5 overflow-hidden">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-slate-900 [overflow-wrap:anywhere] lg:text-xl">{title}</h2>
          {subtitle ? <p className="break-words text-sm text-slate-600 [overflow-wrap:anywhere]">{subtitle}</p> : null}
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="max-w-full shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
