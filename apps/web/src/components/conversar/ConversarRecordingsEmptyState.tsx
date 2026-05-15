import Link from "next/link";
import { PrimaryButton } from "@/components/ui";

export function ConversarRecordingsEmptyState() {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <h3 className="text-lg font-bold text-slate-900">No encontramos grabaciones</h3>
      <p className="mt-2 text-sm text-slate-600">Prueba con otro tema o cambia los filtros para encontrar conversaciones grabadas.</p>
      <Link href="/app/conversar" className="mt-4 inline-flex"><PrimaryButton type="button">Volver a Conversar</PrimaryButton></Link>
    </article>
  );
}
