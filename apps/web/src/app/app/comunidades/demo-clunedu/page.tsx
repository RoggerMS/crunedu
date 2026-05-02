export default function DemoClunEduPage() {
  return (
    <section className="space-y-6">
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <div className="h-44 bg-slate-200">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80"
            alt="Portada de ClunEDU"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="-mt-8 px-6 pb-6">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-indigo-50">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80"
              alt="Perfil de ClunEDU"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            ClunEDU
          </h1>
          <p className="mt-2 text-slate-600">
            Vista previa de cómo se verá una comunidad publicada. Este ejemplo
            es temporal y fácil de remover.
          </p>
        </div>
      </article>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        Esta página es solo demostración visual en código (no persistida en base
        de datos).
      </div>
    </section>
  );
}
