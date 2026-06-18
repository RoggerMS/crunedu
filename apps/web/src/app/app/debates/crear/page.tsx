"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Card, PrimaryButton } from "@/components/ui";

export default function CreateDebatePage() {
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
            Crear debate
          </h1>
          <p className="text-sm text-slate-600">
            Los debates se crean desde la sección <strong>Conversar</strong>,
            donde puedes elegir el tipo de conversación, definir posturas y
            esperar participantes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton asChild>
            <Link href="/app/conversar/nueva">
              <MessageCircle size={16} />
              Crear conversación o debate
              <ArrowRight size={16} />
            </Link>
          </PrimaryButton>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Tipos de conversación
        </h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li><strong>Debate formal:</strong> Conversación con posturas definidas, argumentos y turnos más ordenados.</li>
          <li><strong>Sala de estudio:</strong> Para resolver dudas, practicar ejercicios o estudiar con otros.</li>
          <li><strong>Conversación abierta:</strong> Para hablar libremente sobre un tema, compartir ideas u opiniones.</li>
          <li><strong>Pregunta para conversar:</strong> Para iniciar una conversación desde una pregunta abierta.</li>
        </ul>
        <Link
          href="/app/conversar/temas"
          className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Explorar temas →
        </Link>
      </Card>
    </section>
  );
}
