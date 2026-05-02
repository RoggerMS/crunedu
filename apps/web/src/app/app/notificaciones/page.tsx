import { Card, EmptyState, SecondaryButton } from "@/components/ui";
import Link from "next/link";

export default function NotificacionesPage() {
  return (
    <section className="space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-black">Notificaciones</h1>
        <p className="text-sm text-slate-600">Aquí verás publicaciones relevantes, preguntas destacadas y actividad de tus amigos.</p>
      </Card>

      <EmptyState
        title="Aún no tienes notificaciones"
        description="Cuando haya novedades en comunidades, preguntas o actividad de amigos, aparecerán aquí."
        action={<SecondaryButton asChild><Link href="/app">Volver al inicio</Link></SecondaryButton>}
      />
    </section>
  );
}
