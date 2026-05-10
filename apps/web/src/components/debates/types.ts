export type DebateMode = "academicos" | "generales";
export type DebateStatus = "en_curso" | "cerrado" | "sin_resolver";
export type DebateTime = "esta_semana" | "semana_actual" | "todos";
export type DebateSort = "mas_comentados" | "mas_recientes" | "participacion";

export type DebateSide = { id: "a" | "b"; label: string; description: string; argumentsCount: number };
export type HighlightedArgument = { id: string; authorName: string; side: "a" | "b"; content: string };

export type DebateItem = {
  id: string;
  mode: DebateMode;
  title: string;
  description: string;
  category: string;
  authorName: string;
  createdAt: string;
  status: DebateStatus;
  isFeatured?: boolean;
  isWeekly?: boolean;
  isJoined?: boolean;
  isSaved?: boolean;
  sideA: DebateSide;
  sideB: DebateSide;
  stats: { responses: number; participants: number; views: number };
  highlightedArguments: HighlightedArgument[];
};
