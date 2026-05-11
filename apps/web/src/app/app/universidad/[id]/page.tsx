"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { universityItemsFallback } from "@/components/university/university-data";

export default function UniversidadDetailPage() {
  const params = useParams<{ id: string }>();
  const item = universityItemsFallback.find((entry) => entry.id === params.id);
  if (!item) return <div><p>No encontramos esta información.</p><Link href="/app/universidad">Volver a Universidad</Link></div>;
  return <section className="space-y-3 rounded-2xl border bg-white p-5"><Link href="/app/universidad" className="text-sm text-indigo-600">← Volver a Universidad</Link><h1 className="text-2xl font-black">{item.title}</h1><p className="text-slate-700">{item.description}</p><p className="text-sm text-slate-500">Área: {item.area} · Estado: {item.status.join(", ")} · Ubicación: {item.location ?? "Por confirmar"}</p><p className="text-sm text-slate-500">Fecha: {item.startDate ?? item.deadline ?? "Sin fecha"}</p><div className="flex gap-2"><button className="rounded border px-3 py-2 text-sm">Guardar</button><button className="rounded border px-3 py-2 text-sm">Compartir</button></div></section>;
}
