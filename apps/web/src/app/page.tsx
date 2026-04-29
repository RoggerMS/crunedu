import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <LandingHeader />

      <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-20 md:py-28">
        <p className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">CrunEdu es una red universitaria independiente.</p>

        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
          Tu espacio para resolver dudas reales de la universidad.
        </h1>

        <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold text-slate-900">Propuesta de valor</h2>
          <p className="mt-3 leading-7 text-slate-600">
            En CrunEdu encuentras comunidades, publicaciones y guías útiles para trámites, apuntes y vida universitaria,
            todo en un solo lugar y con enfoque en estudiantes.
          </p>
        </div>

        <Link href="/app" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-soft">
          Empezar
        </Link>
      </section>
    </main>
  );
}
