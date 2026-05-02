import Link from "next/link";
import { Shield, Store, Flag, Layers } from "lucide-react";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

export default function AdminPage() {
  return (
    <section className="space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-black">Panel de administración</h1>
        <p className="text-sm text-slate-600">Accesos rápidos para administración de CrunEdu y bloques internos de trabajo.</p>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="space-y-3">
          <h2 className="text-base font-bold">Admin tienda</h2>
          <p className="text-sm text-slate-600">Gestiona productos y consultas de la tienda básica de CrunEdu.</p>
          <PrimaryButton asChild><Link href="/app/admin/tienda"><Store size={16} />Ir a admin tienda</Link></PrimaryButton>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold">Admin reportes</h2>
          <p className="text-sm text-slate-600">Revisa reportes de contenido y aplica decisiones de moderación.</p>
          <PrimaryButton asChild><Link href="/app/admin/reportes"><Flag size={16} />Ir a admin reportes</Link></PrimaryButton>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold">Vista reutilizable</h2>
          <p className="text-sm text-slate-600">Bloques de valor diario y acciones reutilizables para futuras iteraciones.</p>
          <SecondaryButton asChild><Link href="/app/reutilizable"><Layers size={16} />Abrir vista reutilizable</Link></SecondaryButton>
        </Card>
      </div>

      <Card className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><Shield size={16} />Nota</p>
        <p className="text-sm text-slate-600">Este panel es básico y puede crecer en próximos pasos según las prioridades del MVP.</p>
      </Card>
    </section>
  );
}
