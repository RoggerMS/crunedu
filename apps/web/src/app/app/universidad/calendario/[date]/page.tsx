"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { calendarEventsFallback } from "@/components/university/university-data";

export default function UniversidadAgendaDiaPage() {
  const params = useParams<{ date: string }>();
  const { date } = params;

  const events = useMemo(
    () => calendarEventsFallback.filter((e) => e.date === date),
    [date],
  );

  const dateFormatted = useMemo(() => {
    try {
      const d = new Date(date + "T12:00:00");
      return d.toLocaleDateString("es-PE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <section className="space-y-4">
      <Link
        href="/app/universidad/calendario"
        className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
      >
        ← Volver al calendario
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black text-slate-900">
          Agenda del día
        </h1>
        <p className="mt-1 text-sm capitalize text-slate-600">{dateFormatted}</p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No hay eventos registrados para esta fecha.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            ¿Falta algún evento? Puedes sugerir información desde la sección Universidad.
          </p>
          <Link
            href="/app/universidad"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir a Universidad
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 capitalize">
                    {event.type}
                  </p>
                  {event.time && (
                    <p className="mt-1 text-xs text-slate-600">
                      Horario: {event.time}
                    </p>
                  )}
                  {event.location && (
                    <p className="text-xs text-slate-600">
                      Ubicación: {event.location}
                    </p>
                  )}
                </div>
                <Link
                  href={`/app/universidad/${event.itemId}`}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ver detalle
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
