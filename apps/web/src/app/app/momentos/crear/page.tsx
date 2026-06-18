"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Image } from "lucide-react";
import { Card } from "@/components/ui";

export default function CreateMomentPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl space-y-4">
        <Card className="space-y-4">
          <Link
            href="/app/momentos"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={16} />
            Volver a Momentos
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">
              Crear momento
            </h1>
            <p className="text-sm text-slate-600">
              Captura y comparte experiencias de la vida universitaria:
              momentos del campus, actividades, eventos o cualquier instancia
              que quieras recordar.
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            ¿Cómo crear un momento?
          </h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
            <li>
              Desde la página de <strong>Momentos</strong>, usa el botón
              flotante <strong>+</strong> en la esquina inferior derecha para
              abrir el formulario de creación.
            </li>
            <li>
              Escribe una descripción breve de tu momento universitario.
            </li>
            <li>
              Opcional: agrega una imagen representativa (foto del campus,
              evento o actividad).
            </li>
            <li>
              Opcional: activa el <strong>boost</strong> para darle más
              visibilidad a tu momento.
            </li>
            <li>Publica y comparte tu momento con la comunidad.</li>
          </ol>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Ideas para tus momentos
          </h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <Camera size={16} className="mt-0.5 shrink-0 text-indigo-600" />
              <span>Un día en el campus: biblioteca, áreas verdes o aulas.</span>
            </li>
            <li className="flex items-start gap-2">
              <Image size={16} className="mt-0.5 shrink-0 text-indigo-600" />
              <span>Eventos universitarios: conferencias, talleres o actividades culturales.</span>
            </li>
            <li className="flex items-start gap-2">
              <Camera size={16} className="mt-0.5 shrink-0 text-indigo-600" />
              <span>Grupos de estudio o momentos con compañeros.</span>
            </li>
            <li className="flex items-start gap-2">
              <Image size={16} className="mt-0.5 shrink-0 text-indigo-600" />
              <span>Logros académicos o personales durante tu vida universitaria.</span>
            </li>
          </ul>
        </Card>

        <Link
          href="/app/momentos"
          className="block rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Ir a Momentos
        </Link>
      </div>
    </main>
  );
}
