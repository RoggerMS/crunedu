export default function Page() {
  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Momentos</h1>
        <p className="mt-2 text-slate-600">Eventos temporales y conversación de la vida universitaria.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Inicio de clases</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Aniversario</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Día del Maestro</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
      </div>
    </section>
  );
}
