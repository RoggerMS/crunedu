import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="text-xl font-black tracking-tight text-slate-950">
        Crun<span className="text-indigo-600">Edu</span>
      </Link>
      <Link href="/app" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
        Ver muestra
      </Link>
    </header>
  );
}
