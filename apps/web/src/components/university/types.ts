export type UniversityItemType = "tramite" | "convocatoria" | "evento" | "servicio" | "guia" | "aviso";

export type UniversityItemStatus =
  | "urgente"
  | "oficial"
  | "nuevo"
  | "abierto"
  | "actualizado"
  | "cerrado"
  | "pendiente_revision"
  | "proximo_cierre";

export type UniversityVisibility = "publico" | "oficial" | "sugerido";

export type UniversityItem = {
  id: string;
  type: UniversityItemType;
  title: string;
  description: string;
  area: string;
  category: string;
  visibility: UniversityVisibility;
  status: UniversityItemStatus[];
  startDate?: string;
  endDate?: string;
  deadline?: string;
  time?: string;
  location?: string;
  cost?: string;
  file?: { id: string; name: string; type: string; size: number; url?: string };
  externalUrl?: string;
  tags: string[];
  stats: { views: number; saves: number; shares: number };
  viewerState: { saved: boolean; isMine?: boolean };
};

export type UniversityCalendarEvent = { id: string; itemId: string; title: string; date: string; type: UniversityItemType; location?: string; time?: string };
