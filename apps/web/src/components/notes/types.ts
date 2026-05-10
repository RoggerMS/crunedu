export type NoteFileType = "pdf" | "word" | "ppt" | "image" | "zip";
export type NoteStatus = "verificado" | "nuevo" | "popular" | "para_parcial" | "actualizado" | "pendiente_revision";
export type NoteVisibility = "publico" | "comunidad" | "privado";

export type NoteFile = { id: string; name: string; size: number; type: string; fileType: NoteFileType; pages?: number; slides?: number; exercises?: number; url?: string };
export type NoteImage = { id: string; url: string; alt?: string };
export type NoteComment = { id: string; authorName: string; content: string; createdAt: string };

export type NoteItem = {
  id: string;
  title: string;
  description: string;
  course: string;
  materialType: string;
  authorName: string;
  authorAvatarUrl?: string;
  createdAt: string;
  status: NoteStatus;
  tags: string[];
  file?: NoteFile;
  images?: NoteImage[];
  rating: { average: number; count: number; viewerRating?: number };
  stats: { downloads: number; saves: number; comments: number; views: number };
  viewerState: { saved: boolean; isMine?: boolean };
  commentsPreview?: NoteComment[];
};

export type NoteDraftInput = {
  title: string; description: string; course: string; materialType: string; tags: string[]; visibility: NoteVisibility; communityId?: string;
  file?: Pick<NoteFile, "name" | "size" | "type" | "fileType">;
  images?: Array<Pick<NoteImage, "url" | "alt">>;
};
