"use client";

import { useMemo, useState } from "react";
import { debateCourseCatalog } from "@/modules/debates/courseCatalog";

export default function DebatesPage() {
  const [category, setCategory] = useState<"general" | "specialty">("general");
  const courses = useMemo(() => debateCourseCatalog.filter((item) => item.category === category), [category]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Debates por curso</h1>
      <p className="text-sm text-gray-600">Selecciona una pestaña para ver cursos con debates semanales.</p>

      <div className="flex gap-2">
        <button className={`rounded-md px-3 py-2 text-sm ${category === "general" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setCategory("general")}>Generales</button>
        <button className={`rounded-md px-3 py-2 text-sm ${category === "specialty" ? "bg-black text-white" : "bg-gray-100"}`} onClick={() => setCategory("specialty")}>Especialidad</button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {courses.map((course) => (
          <li key={course.key} className="rounded-lg border p-3">
            <h2 className="font-medium">{course.label}</h2>
            <p className="text-xs text-gray-500">Clave: {course.key}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
