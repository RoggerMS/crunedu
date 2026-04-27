import { APP_TAGLINE } from "@crunedu/shared";
import { BookOpen, MessageSquare, Package, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { ModuleCard } from "@/components/module-card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-100">
      <LandingHeader />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
            MVP local con Docker · Sin dominio todavía
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            CrunEdu, la red universitaria para preguntar, compartir y conectar.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{APP_TAGLINE}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-soft">
              Ver demo del panel
            </Link>
            <a href="#modulos" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800">
              Ver módulos
            </a>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <p className="text-sm font-bold text-indigo-200">Feed universitario</p>
            <h2 className="mt-4 text-2xl font-black">¿Alguien sabe cómo va el trámite del carnet?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Publicaciones, preguntas, apuntes, trámites y tienda en un mismo ecosistema.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Comunidades por carrera",
              "Preguntas con respuestas útiles",
              "Apuntes permitidos",
              "Tienda administrada",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Mapa del MVP</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Estructura preparada para que otro ingeniero entienda rápido qué existe, qué falta y qué debe implementarse por fases.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <ModuleCard icon={<UsersRound />} title="Comunidades" description="Espacios por carrera, facultad, trámite o tema." />
          <ModuleCard icon={<MessageSquare />} title="Preguntas" description="Dudas, respuestas útiles y etiquetas." />
          <ModuleCard icon={<BookOpen />} title="Apuntes" description="Documentos permitidos con validación de formato y peso." />
          <ModuleCard icon={<Package />} title="Tienda" description="Catálogo administrado por CrunEdu, sin pagos automáticos." />
          <ModuleCard icon={<ShieldCheck />} title="Moderación" description="Reportes, revisión prioritaria y acciones de moderador." />
          <ModuleCard icon={<UsersRound />} title="Perfiles" description="Información básica del estudiante y avatar." />
        </div>
      </section>

      <section id="tienda" className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-[2rem] bg-indigo-600 p-8 text-white">
          <h2 className="text-3xl font-black">CrunEdu Market empieza simple</h2>
          <p className="mt-3 max-w-3xl leading-7 text-indigo-100">La tienda será una sección de monetización administrada por CrunEdu. No habrá vendedores externos, comisiones, pagos automáticos ni carrito avanzado en el MVP.</p>
        </div>
      </section>
    </main>
  );
}
