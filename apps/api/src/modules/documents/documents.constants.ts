export type DocumentFileCategory = "pdf" | "word" | "image" | "zip" | "ppt" | "excel" | "other";

type AllowedRule = {
  category: DocumentFileCategory;
  extensions: string[];
  mimeTypes: string[];
  maxBytes: number;
};

export const DOCUMENT_UPLOAD_RULES: AllowedRule[] = [
  {
    category: "pdf",
    extensions: ["pdf"],
    mimeTypes: ["application/pdf"],
    maxBytes: 20 * 1024 * 1024,
  },
  {
    category: "word",
    extensions: ["doc", "docx"],
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxBytes: 15 * 1024 * 1024,
  },
  {
    category: "image",
    extensions: ["jpg", "jpeg", "png", "webp"],
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 8 * 1024 * 1024,
  },
  {
    category: "zip",
    extensions: ["zip"],
    mimeTypes: ["application/zip", "application/x-zip-compressed"],
    maxBytes: 25 * 1024 * 1024,
  },
  {
    category: "ppt",
    extensions: ["ppt", "pptx"],
    mimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    maxBytes: 25 * 1024 * 1024,
  },
  {
    category: "excel",
    extensions: ["xls", "xlsx"],
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxBytes: 15 * 1024 * 1024,
  },
];

export const DOCUMENT_PUBLIC_PATH = "/api/apuntes/files";
export const DOCUMENT_UPLOAD_FOLDER = "documents";

export function getExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  if (index < 0) return "";
  return filename.slice(index + 1).toLowerCase();
}

export function resolveDocumentCategory(filename: string, mimeType: string): DocumentFileCategory {
  const ext = getExtension(filename);
  for (const rule of DOCUMENT_UPLOAD_RULES) {
    if (rule.extensions.includes(ext)) return rule.category;
    if (mimeType && rule.mimeTypes.includes(mimeType)) return rule.category;
  }
  return "other";
}

export function findUploadRule(filename: string, mimeType: string): AllowedRule | null {
  const ext = getExtension(filename);
  for (const rule of DOCUMENT_UPLOAD_RULES) {
    if (rule.extensions.includes(ext) || (mimeType && rule.mimeTypes.includes(mimeType))) {
      return rule;
    }
  }
  return null;
}
