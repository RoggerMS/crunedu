export default function Page() {
  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Preguntas</h1>
        <p className="mt-2 text-slate-600">Dudas académicas y universitarias con respuestas útiles.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">¿Cómo tramito el carnet?</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">¿Qué documentos piden para matrícula?</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"><h2 className="text-lg font-bold">¿Dónde encuentro apuntes de Matemática?</h2><p className="mt-2 text-sm text-slate-600">Pendiente de conectar con API.</p></div>
      </div>
    </section>
  );
}
