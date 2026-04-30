import Link from "next/link";
import { PageState } from "@/components/ui";

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
            <div key={procedure} className="flex flex-col gap-2 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold">{procedure}</p>
              <Link href="/app/preguntas" className="text-sm text-indigo-700 hover:underline">Hacer pregunta</Link>
            </div>
          ))}
        </div>
      </div>
      <PageState
        type="success"
        title="¿Tu trámite no aparece aquí?"
        description="Crea una pregunta con tu caso y recibe orientación de estudiantes que ya pasaron por ese proceso."
        action={<Link href="/app/preguntas" className="text-sm font-semibold text-indigo-700 hover:underline">Inicia tu consulta</Link>}
      />
    </section>
  );
}
