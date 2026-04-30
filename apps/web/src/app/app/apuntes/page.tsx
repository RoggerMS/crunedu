import Link from "next/link";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

export default function Page() {
  return (
    <section className="space-y-6">
      <ModuleHeader title="Apuntes" description="Comparte material permitido y encuentra recursos para estudiar." />
      <PageState
        type="empty"
        title="Aún no hay apuntes cargados"
        description="Puedes iniciar una solicitud en el feed o unirte a una comunidad para coordinar material por curso."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/app" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publicar</Link>
            <Link href="/app/comunidades" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Unirme</Link>
          </div>
        }
      />
    </section>
  );
}
