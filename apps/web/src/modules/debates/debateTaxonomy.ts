export type DebateScope = "academic" | "non-academic";

export type DebateCategory = {
  key: string;
  label: string;
  scope: DebateScope;
  subcategories: { key: string; label: string }[];
};

export const debateTaxonomy: DebateCategory[] = [
  {
    key: "general-course",
    label: "Curso general",
    scope: "academic",
    subcategories: [
      { key: "matematica", label: "Matemática" },
      { key: "comunicacion", label: "Comunicación" },
      { key: "ciencias", label: "Ciencias" },
      { key: "historia", label: "Historia" },
    ],
  },
  {
    key: "specialty-course",
    label: "Curso de especialidad",
    scope: "academic",
    subcategories: [
      { key: "didactica", label: "Didáctica" },
      { key: "evaluacion", label: "Evaluación educativa" },
      { key: "practica", label: "Práctica preprofesional" },
      { key: "investigacion", label: "Investigación" },
    ],
  },
  {
    key: "campus-life",
    label: "Vida universitaria",
    scope: "non-academic",
    subcategories: [
      { key: "tramites", label: "Trámites" },
      { key: "bienestar", label: "Bienestar" },
      { key: "eventos", label: "Eventos" },
      { key: "convivencia", label: "Convivencia" },
    ],
  },
  {
    key: "unanime",
    label: "Unánimes",
    scope: "non-academic",
    subcategories: [
      { key: "opiniones-populares", label: "Opiniones populares" },
      { key: "hot-takes", label: "Hot takes" },
      { key: "controversias", label: "Controversias" },
    ],
  },
  {
    key: "series-tv",
    label: "Series y TV",
    scope: "non-academic",
    subcategories: [
      { key: "series", label: "Series" },
      { key: "anime", label: "Anime" },
      { key: "peliculas", label: "Películas" },
      { key: "reality", label: "Reality shows" },
    ],
  },
  {
    key: "sports",
    label: "Deportes",
    scope: "non-academic",
    subcategories: [
      { key: "futbol", label: "Fútbol" },
      { key: "voley", label: "Vóley" },
      { key: "basket", label: "Básquet" },
      { key: "otros", label: "Otros deportes" },
    ],
  },
];
