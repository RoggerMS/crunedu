export class UploadDocumentFileResponseDto {
  fileUrl: string;
  storageKey: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}
