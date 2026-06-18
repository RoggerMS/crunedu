"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, PrimaryButton, SecondaryButton } from "@/components/ui";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function DebateDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <section className="space-y-5">
      <Link
        href="/app/debates"
        className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        ← Volver a Debates
      </Link>

      <Card className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">
            Debate: {params.id}
          </h1>
          <p className="text-sm text-slate-600">
            Los debates ahora se realizan dentro de la sección Conversar.
            Para ver o participar en un debate específico, busca la
            conversación correspondiente.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton asChild>
            <Link href="/app/conversar?tab=debates">
              <MessageCircle size={16} />
              Ver debates activos
              <ArrowRight size={16} />
            </Link>
          </PrimaryButton>
          <SecondaryButton asChild>
            <Link href="/app/conversar/nueva">Crear nuevo debate</Link>
          </SecondaryButton>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          ¿No encuentras tu debate?
        </h2>
        <p className="text-sm text-slate-600">
          Los debates se listan por categoría, tema y estado en la sección
          Conversar. Puedes explorar por curso o tema para encontrar
          conversaciones relacionadas.
        </p>
        <SecondaryButton asChild>
          <Link href="/app/conversar/temas">Explorar por temas</Link>
        </SecondaryButton>
      </Card>
    </section>
  );
}
