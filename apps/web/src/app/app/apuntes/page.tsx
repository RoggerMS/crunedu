import Link from "next/link";
import { PageState } from "@/components/ui";

export default function Page() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Apuntes</h1>
        <p className="mt-1 text-sm text-slate-600">Comparte material permitido y encuentra recursos para estudiar.</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Acciones disponibles</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/app/comunidades" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">Unirme a una comunidad de apuntes</Link>
          <Link href="/app" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">Publicar solicitud de apuntes</Link>
          <Link href="/app/preguntas" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50">Preguntar sobre un curso</Link>
          <button className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-left text-sm text-slate-500">Subida de archivos: próximamente</button>
        </div>
      </div>

      <PageState
        type="success"
        title="¿No encuentras lo que buscas?"
        description="Puedes pedir apuntes en el feed o preguntar por curso para recibir ayuda de otros estudiantes."
        action={<Link href="/app" className="text-sm font-semibold text-indigo-700 hover:underline">Ir al feed para publicar</Link>}
      />
    </section>
  );
}
