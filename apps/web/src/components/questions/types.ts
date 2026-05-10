export type QuestionStatus = "sin_responder" | "respondida" | "resuelta" | "urgente" | "con_mejor_respuesta";

export type QuestionFile = { id: string; name: string; size: number; type: string };
export type QuestionImage = { id: string; url: string; alt?: string };
export type QuestionAnswer = {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  votes: number;
  createdAt: string;
  isBest?: boolean;
  viewerState?: { voted: boolean };
};

export type QuestionItem = {
  id: string;
  title: string;
  description: string;
  course: string;
  authorName: string;
  authorAvatarUrl?: string;
  createdAt: string;
  status: QuestionStatus;
  tags: string[];
  images?: QuestionImage[];
  files?: QuestionFile[];
  stats: { answers: number; votes: number; views: number; saves: number };
  viewerState: { voted: boolean; saved: boolean; isMine?: boolean };
  bestAnswer?: QuestionAnswer;
  answersPreview?: QuestionAnswer[];
};
