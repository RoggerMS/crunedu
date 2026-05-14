import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";

export default function ConversarPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Conversar</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Encuentra estudiantes para hablar, estudiar, resolver dudas o compartir ideas.
        </p>
      </header>

      <Card className="space-y-4 border-indigo-100">
        <p className="text-sm font-medium text-slate-700">
          La sección Conversar se implementará por módulos.
        </p>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="button" disabled>
            Crear conversación
          </PrimaryButton>
          <SecondaryButton type="button" disabled>
            Buscar compañeros
          </SecondaryButton>
        </div>
      </Card>
    </section>
  );
}
