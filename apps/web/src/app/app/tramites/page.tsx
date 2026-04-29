import Link from "next/link";

const procedures = ["Carné universitario", "Matrícula", "Comedor", "Constancias"];

export default function Page() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Trámites</h1>
        <p className="mt-1 text-sm text-slate-600">Resuelve trámites con ayuda de experiencias reales de estudiantes.</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Qué puedes hacer ahora</h2>
        <div className="mt-4 space-y-3">
          {procedures.map((procedure) => (
            <div key={procedure} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold">{procedure}</p>
              <Link href="/app/preguntas" className="text-sm text-indigo-700 hover:underline">Hacer pregunta</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
