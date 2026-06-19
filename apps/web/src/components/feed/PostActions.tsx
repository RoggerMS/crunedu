import { Bookmark, EyeOff, Flag, MessageCircle, PencilLine, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ActionMenu";

export type PostActionsProps = {
  likes: number;
  comments: number;
  saves: number;
  liked: boolean;
  saved: boolean;
  isMine?: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onReport: () => void;
  onHide: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  canReport?: boolean;
};

const primaryActionClass =
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 sm:text-sm";
const activeActionClass = "text-indigo-600 hover:bg-indigo-50";

export function PostActions({
  likes,
  comments,
  saves,
  liked,
  saved,
  isMine,
  onLike,
  onComment,
  onSave,
  onShare,
  onReport,
  onHide,
  onDelete,
  onEdit,
  canReport = true,
}: PostActionsProps) {
  const menuItems: ActionMenuItem[] = [
    { key: "share", label: "Compartir", icon: Share2, onSelect: onShare },
    ...(canReport ? [{ key: "report", label: "Reportar", icon: Flag, onSelect: onReport }] : []),
    { key: "hide", label: "Ocultar", icon: EyeOff, onSelect: onHide },
    ...(isMine && onEdit ? [{ key: "edit", label: "Editar", icon: PencilLine, onSelect: onEdit }] : []),
    ...(isMine && onDelete ? [{ key: "delete", label: "Eliminar", icon: Trash2, onSelect: onDelete, danger: true }] : []),
  ];

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 sm:gap-2">
        <button className={`${primaryActionClass} ${liked ? activeActionClass : ""}`} onClick={onLike} aria-pressed={liked}>
          <ThumbsUp size={16} />
          <span>Me gusta{likes > 0 ? ` (${likes})` : ""}</span>
        </button>
        <button className={primaryActionClass} onClick={onComment}>
          <MessageCircle size={16} />
          <span>Comentar{comments > 0 ? ` (${comments})` : ""}</span>
        </button>
        <button className={`${primaryActionClass} ${saved ? activeActionClass : ""}`} onClick={onSave} aria-pressed={saved}>
          <Bookmark size={16} />
          <span>Guardar{saves > 0 ? ` (${saves})` : ""}</span>
        </button>
      </div>
      <ActionMenu items={menuItems} ariaLabel="Más acciones de la publicación" />
    </div>
  );
}
