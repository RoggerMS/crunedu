"use client";
import { Suspense } from "react";
import { UniversityCalendarPage } from "@/components/university/UniversityCalendarPage";

export default function UniversidadCalendarioPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-12 bg-slate-100 rounded" />
        <div className="h-[400px] bg-slate-100 rounded-xl" />
      </div>
    }>
      <UniversityCalendarPage />
    </Suspense>
  );
}
