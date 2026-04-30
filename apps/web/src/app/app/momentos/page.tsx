import Link from "next/link";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

export default function Page() {
  return (
    <section className="space-y-6">
      <ModuleHeader title="Momentos" description="Comparte lo que está pasando en el campus y conversa con tu comunidad." />
      <PageState
        type="success"
        title="Comparte un momento universitario"
        description="Usa el feed para contar actividades, fechas importantes o experiencias de tu facultad."
        action={<Link href="/app" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publicar</Link>}
      />
    </section>
  );
}
