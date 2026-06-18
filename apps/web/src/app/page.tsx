import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { PublicFooter } from "@/components/public-footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingHeader />
      <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-20 md:py-28">
        <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
          Comunidades y publicaciones para resolver tu vida universitaria.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          CrunEdu conecta estudiantes para compartir dudas, respuestas, comunidades y recursos útiles desde un solo lugar.
        </p>
        <p className="max-w-2xl rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          Somos una comunidad estudiantil independiente. CrunEdu no es una plataforma ni un sitio oficial de la universidad.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/register" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">Crear cuenta</Link>
          <Link href="/login" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700">Iniciar sesión</Link>
          <Link href="/app/comunidades" className="rounded-full px-4 py-3 text-sm font-semibold text-indigo-700">Explorar comunidades</Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
