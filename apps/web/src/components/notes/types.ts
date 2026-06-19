export type NoteFileType = "pdf" | "word" | "image" | "zip" | "ppt" | "excel" | "other";

export type NoteVisibility = "public" | "community" | "private";

export type NoteFile = {
  name: string;
  url: string;
  downloadUrl: string;
  size: number;
  mimeType: string;
  fileType: NoteFileType;
};

export type NoteItem = {
  id: string;
  title: string;
  description: string | null;
  course: string | null;
  cycle: string | null;
  materialType: string | null;
  file: NoteFile;
  author: { id: number; name: string };
  community: { id: number; name: string; slug?: string } | null;
  visibility: NoteVisibility;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  rating: { average: number; count: number; viewerRating: number | null };
  stats: { downloads: number; saves: number; views: number };
  viewerState: { saved: boolean; isMine: boolean; canEdit: boolean; canDelete: boolean; canReport: boolean };
};

export type NoteDraftInput = {
  title: string;
  description: string;
  course?: string;
  cycle?: string;
  materialType?: string;
  tags: string[];
  visibility: NoteVisibility;
  communityId?: number;
};

export const NOTE_COURSES = [
  "Matemática",
  "Estadística",
  "Física",
  "Programación",
  "Comunicación",
  "Historia",
  "Inglés",
  "Educación",
  "Otros",
];

export const NOTE_MATERIAL_TYPES = ["Resumen", "Ejercicios", "Fórmulas", "Guías", "Separatas", "Otros"];

export const NOTE_FILE_TYPES: { value: string; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
  { value: "image", label: "Imagen" },
  { value: "zip", label: "ZIP" },
  { value: "ppt", label: "PPT" },
  { value: "excel", label: "Excel" },
];
