"use client";
import Link from "next/link";
import { calendarEventsFallback } from "@/components/university/university-data";

export default function UniversidadCalendarioPage() {
  return <section className="space-y-4"><div><h1 className="text-2xl font-black">Calendario universitario</h1><p className="text-sm text-slate-600">Consulta fechas, trámites, convocatorias, eventos y servicios en un solo lugar.</p></div><div className="rounded-2xl border bg-white p-4"><p className="font-semibold">Eventos del mes</p><ul className="mt-2 space-y-2">{calendarEventsFallback.map((e)=><li key={e.id} className="text-sm">{e.date} — {e.title}</li>)}</ul></div><Link href="/app/universidad" className="text-indigo-600">Volver a Universidad</Link></section>;
}
