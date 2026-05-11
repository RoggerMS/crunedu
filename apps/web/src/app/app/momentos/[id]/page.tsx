"use client";
import { useParams } from "next/navigation";
import { MomentDetail } from "@/components/moments/MomentDetail";
import { fallbackMoments } from "@/components/moments/moments-data";
export default function MomentDetailPage() { const params = useParams<{ id: string }>(); const moment = fallbackMoments.find((m)=>m.id===params.id); if (!moment) return <div className="p-6">Este momento ya expiró.</div>; return <main className="min-h-screen bg-slate-50 p-4"><MomentDetail moment={moment} /></main>; }
