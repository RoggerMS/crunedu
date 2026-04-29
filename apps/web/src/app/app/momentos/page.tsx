import Link from "next/link";

const moments = ["Inicio de clases", "Aniversario", "Semana de exámenes"];

export default function Page() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Momentos</h1>
        <p className="mt-1 text-sm text-slate-600">Comparte lo que está pasando en el campus y conversa con tu comunidad.</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Participa</h2>
        <div className="mt-4 space-y-3">
          {moments.map((moment) => (
            <div key={moment} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold">{moment}</p>
              <Link href="/app" className="text-sm text-indigo-700 hover:underline">Publicar experiencia</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
