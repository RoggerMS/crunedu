import Link from "next/link";

type ModuleHeaderProps = {
  title: string;
  description: string;
  breadcrumbLabel?: string;
};

export function ModuleHeader({ title, description, breadcrumbLabel = "Inicio" }: ModuleHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Link href="/app" className="hover:text-indigo-700">{breadcrumbLabel}</Link> / {title}
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </header>
  );
}
