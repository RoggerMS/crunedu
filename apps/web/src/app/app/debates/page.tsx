"use client";

import Link from "next/link";
import { MessageCircle, Users, Lightbulb, Scale } from "lucide-react";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Debates formales",
    desc: "Participa en debates con posturas definidas, argumentos y turnos ordenados.",
  },
  {
    icon: Users,
    title: "Conversaciones en vivo",
    desc: "Únete a salas de voz para conversar, estudiar o debatir con otros estudiantes.",
  },
  {
    icon: Lightbulb,
    title: "Salas de estudio",
    desc: "Resuelve dudas y practica ejercicios en sesiones colaborativas.",
  },
  {
    icon: Scale,
    title: "Posturas y argumentos",
    desc: "Propón posturas, defiende tus ideas y escucha perspectivas distintas.",
  },
];

export default function DebatesPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5">
        <h1 className="text-2xl font-black text-slate-900">Debates</h1>
        <p className="mt-1 text-sm text-slate-600">
          Los debates de CrunEdu ahora se realizan en la sección Conversar, donde
          puedes crear y unirte a conversaciones estructuradas por tipo, tema y
          postura.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/app/conversar/nueva"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Crear debate
          </Link>
          <Link
            href="/app/conversar?tab=debates"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Ver debates activos
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <feature.icon size={20} />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {feature.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{feature.desc}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">
          ¿Cómo funciona?
        </h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-slate-700">
          <li>Elige tu tipo de conversación: debate formal, sala de estudio, conversación abierta o pregunta.</li>
          <li>Define el tema, la categoría académica y las posturas iniciales.</li>
          <li>Publica tu conversación y espera participantes.</li>
          <li>Cuando haya participantes listos, activen la voz y conversen con respeto.</li>
          <li>Las conversaciones quedan grabadas para consulta posterior.</li>
        </ol>
        <div className="mt-4">
          <Link
            href="/app/conversar/temas"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Explorar temas de conversación →
          </Link>
        </div>
      </article>
    </section>
  );
}
