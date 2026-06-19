"use client";

import { NOTE_COURSES, NOTE_FILE_TYPES, NOTE_MATERIAL_TYPES } from "./types";

type NoteFiltersRailProps = {
  course: string;
  onCourse: (value: string) => void;
  materialType: string;
  onMaterialType: (value: string) => void;
  fileType: string;
  onFileType: (value: string) => void;
};

const railButton = "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition";

export function NoteFiltersRail({ course, onCourse, materialType, onMaterialType, fileType, onFileType }: NoteFiltersRailProps) {
  const courses = ["Todos", ...NOTE_COURSES];
  const materials = ["Todos", ...NOTE_MATERIAL_TYPES];
  const fileTypes = [{ value: "Todos", label: "Todos" }, ...NOTE_FILE_TYPES.map((item) => ({ value: item.value, label: item.label }))];

  return (
    <div className="space-y-4">
      <nav className="rounded-2xl border border-slate-200 bg-white p-3" aria-label="Cursos">
        <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Cursos</h2>
        <ul className="space-y-0.5">
          {courses.map((subject) => {
            const isActive = (course === "Todos" && subject === "Todos") || course === subject;
            return (
              <li key={subject}>
                <button
                  type="button"
                  onClick={() => onCourse(subject)}
                  className={`${railButton} ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {subject}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="rounded-2xl border border-slate-200 bg-white p-3" aria-label="Tipo de material">
        <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Material</h2>
        <ul className="space-y-0.5">
          {materials.map((subject) => {
            const isActive = (materialType === "Todos" && subject === "Todos") || materialType === subject;
            return (
              <li key={subject}>
                <button
                  type="button"
                  onClick={() => onMaterialType(subject)}
                  className={`${railButton} ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {subject}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="rounded-2xl border border-slate-200 bg-white p-3" aria-label="Tipo de archivo">
        <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Archivo</h2>
        <ul className="space-y-0.5">
          {fileTypes.map((subject) => {
            const isActive = (fileType === "Todos" && subject.value === "Todos") || fileType === subject.value;
            return (
              <li key={subject.value}>
                <button
                  type="button"
                  onClick={() => onFileType(subject.value)}
                  className={`${railButton} ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {subject.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
