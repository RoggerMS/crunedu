export type DebateCourseCatalog = {
  key: string;
  label: string;
  category: "general" | "specialty" | "extras";
};

export const debateCourseCatalog: DebateCourseCatalog[] = [
  { key: "comunicacion-academica", label: "Comunicación Académica", category: "general" },
  { key: "matematica-basica", label: "Matemática Básica", category: "general" },
  { key: "didactica-general", label: "Didáctica General", category: "specialty" },
  { key: "evaluacion-educativa", label: "Evaluación Educativa", category: "specialty" },
  { key: "debate-campus", label: "Vida en campus", category: "extras" },
  { key: "tecnologia-estudiantil", label: "Tecnología estudiantil", category: "extras" },
  { key: "bienestar-universitario", label: "Bienestar universitario", category: "extras" },
];
