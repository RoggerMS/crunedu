export default function Page() {
  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Trámites</h1>
        <p className="mt-2 text-slate-600">Información colaborativa sobre procesos universitarios.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Carnet</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Matrícula</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Comedor</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">Constancias</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
      </div>
    </section>
  );
}
