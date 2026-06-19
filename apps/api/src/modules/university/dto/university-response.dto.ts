export class UniversityContentResponseDto {
  id: number;
  type: string;
  title: string;
  description: string;
  area: string;
  category: string;
  visibility: string;
  statusTags: unknown;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  time: string | null;
  location: string | null;
  cost: string | null;
  icon: string | null;
  steps: unknown;
  documents: unknown;
  schedule: string | null;
  warning: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  externalUrl: string | null;
  views: number;
  savesCount: number;
  createdAt: string;
}
