import Link from "next/link";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

export default function Page() {
  return (
    <section className="space-y-6">
      <ModuleHeader title="Trámites" description="Resuelve trámites con ayuda de experiencias reales de estudiantes." />
      <PageState
        type="empty"
        title="No hay guías activas por ahora"
        description="Mientras publicamos guías verificadas, puedes consultar casos reales en preguntas y respuestas."
        action={<Link href="/app/preguntas" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Responder</Link>}
      />
    </section>
  );
}
