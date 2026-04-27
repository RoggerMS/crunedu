import { MessageCircle, Package, UsersRound } from "lucide-react";

const feed = [
  { title: "Carnet universitario", body: "¿Alguien sabe cuándo actualizan el estado del trámite?", meta: "Trámites · 12 comentarios" },
  { title: "Apuntes de Álgebra", body: "Subí un resumen propio de proposiciones y leyes lógicas.", meta: "Apuntes · 8 guardados" },
  { title: "Comedor", body: "Hilo para avisos y experiencias sobre atención esta semana.", meta: "Momentos · 21 respuestas" },
];

export default function AppPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-3xl font-black tracking-tight">Inicio</h1>
          <p className="mt-2 text-slate-600">Feed general del MVP. Aquí luego se conectarán las publicaciones reales desde la API.</p>
        </div>
        <div className="mt-6 space-y-4">
          {feed.map((post) => (
            <article key={post.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{post.meta}</p>
              <h2 className="mt-2 text-xl font-bold">{post.title}</h2>
              <p className="mt-2 text-slate-600">{post.body}</p>
              <div className="mt-4 flex gap-3 text-sm font-semibold text-slate-500">
                <span>Comentar</span><span>Guardar</span><span>Reportar</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <UsersRound className="text-indigo-600" />
          <h3 className="mt-3 font-black">Comunidades iniciales</h3>
          <p className="mt-2 text-sm text-slate-600">General, Trámites, Apuntes y Cachimbos.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <Package className="text-indigo-600" />
          <h3 className="mt-3 font-black">Tienda básica</h3>
          <p className="mt-2 text-sm text-slate-600">Productos destacados y consultas sin pagos automáticos.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <MessageCircle className="text-indigo-600" />
          <h3 className="mt-3 font-black">Preguntas</h3>
          <p className="mt-2 text-sm text-slate-600">Q&A con respuestas útiles.</p>
        </div>
      </aside>
    </div>
  );
}
