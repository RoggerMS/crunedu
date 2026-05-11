"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { universityItemsFallback } from "@/components/university/university-data";

export default function UniversidadDetailPage() {
  const params = useParams<{ id: string }>();
  const item = universityItemsFallback.find((entry) => entry.id === params.id);
  if (!item) return <div><p>No encontramos esta información.</p><Link href="/app/universidad">Volver a Universidad</Link></div>;
  return <section className="space-y-3"><Link href="/app/universidad" className="text-sm text-indigo-600">← Volver a Universidad</Link><h1 className="text-2xl font-black">{item.title}</h1><p>{item.description}</p></section>;
}
