export type DebateCourseCatalog = {
  key: string;
  label: string;
  scope: "academic" | "non-academic";
  section: "general" | "specialty" | "university";
};

export const debateCourseCatalog: DebateCourseCatalog[] = [
  { key: "comunicacion-academica", label: "Comunicación Académica", scope: "academic", section: "general" },
  { key: "matematica-basica", label: "Matemática Básica", scope: "academic", section: "general" },
  { key: "didactica-general", label: "Didáctica General", scope: "academic", section: "specialty" },
  { key: "evaluacion-educativa", label: "Evaluación Educativa", scope: "academic", section: "specialty" },
  { key: "debate-campus", label: "Vida en campus", scope: "non-academic", section: "university" },
  { key: "tecnologia-estudiantil", label: "Tecnología estudiantil", scope: "non-academic", section: "university" },
  { key: "bienestar-universitario", label: "Bienestar universitario", scope: "non-academic", section: "university" },
];
