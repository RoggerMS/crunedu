import type { NoteApiItem } from "@/lib/api-helpers";
import { buildNoteDownloadUrl, buildNoteFileUrl } from "@/lib/api-helpers";
import type { NoteFileType, NoteItem, NoteVisibility } from "./types";

export function mapNoteApiToItem(api: NoteApiItem): NoteItem {
  return {
    id: String(api.id),
    title: api.title,
    description: api.description,
    course: api.course,
    cycle: api.cycle,
    materialType: api.materialType,
    file: {
      name: api.originalName ?? api.title,
      url: buildNoteFileUrl(api.fileUrl),
      downloadUrl: buildNoteDownloadUrl(api.id),
      size: api.sizeBytes,
      mimeType: api.mimeType ?? "",
      fileType: api.fileType as NoteFileType,
    },
    author: api.author,
    community: api.community,
    visibility: api.visibility as NoteVisibility,
    tags: api.tags,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    rating: { average: api.rating.average, count: api.rating.count, viewerRating: api.rating.viewerRating },
    stats: { downloads: api.stats.downloads, saves: api.stats.saves, views: api.stats.views },
    viewerState: api.viewerState,
  };
}
