"use client";

import { AlignLeft, FileUp, MessageCircle, MessageSquarePlus, NotebookPen, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FeedAttachmentPreview } from "./FeedAttachmentPreview";
import { MAX_FEED_IMAGES } from "./constants";
import type { CommunityLite, CreatePostSubmitPayload, LocalAttachmentFile, PostType } from "./types";

const blockedMessages: Record<Exclude<PostType, "publicacion">, string> = {
  apunte: "Los apuntes se crearán desde el módulo Apuntes. Luego podrás compartirlos en el feed.",
  pregunta: "Las preguntas se crearán desde Preguntas. Luego podrás compartirlas en el feed.",
  momento: "Los momentos se crearán desde Momentos. Luego podrás compartirlos en el feed.",
  debate: "Los debates se crean desde Conversar, dentro de la pestaña Debates. Luego podrás compartirlos en el feed.",
  tramite: "Los trámites se crearán desde Universidad. Luego podrás compartirlos en el feed.",
};

type CreatePostModalProps = {
  open: boolean;
  initialType: PostType;
  communities: CommunityLite[];
  isAuthenticated: boolean;
  onClose: () => void;
  onRequireLogin: () => void;
  onSaveDraft: (data: CreatePostSubmitPayload) => void;
  onSubmit: (data: CreatePostSubmitPayload) => Promise<void> | void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
};

export function CreatePostModal(props: CreatePostModalProps) {
  const router = useRouter();
  const [type, setType] = useState<PostType>(props.initialType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [visibility, setVisibility] = useState<"todos" | "comunidad">("todos");
  const [attachedFiles, setAttachedFiles] = useState<LocalAttachmentFile[]>([]);
  const [attachedImages, setAttachedImages] = useState<Array<{ id: string; mediaId: string; previewUrl?: string }>>([]);

  useEffect(() => setType(props.initialType), [props.initialType, props.open]);

  const hasContent = Boolean(content.trim().length > 0 || attachedImages.length > 0);
  const canSubmit = props.isAuthenticated && type === "publicacion" && hasContent;

  const clearAttachedImages = () => {
    attachedImages.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });
    setAttachedImages([]);
    setAttachedFiles([]);
  };

  const resetForm = () => {
    setType(props.initialType);
    setTitle("");
    setContent("");
    setCommunityId("");
    setVisibility("todos");
    clearAttachedImages();
  };

  const handleAttachImage = (file: File) => {
    if (attachedImages.length >= MAX_FEED_IMAGES) {
      props.onToast(`Puedes adjuntar hasta ${MAX_FEED_IMAGES} imágenes.`, "info");
      return;
    }

    const id = crypto.randomUUID();
    setAttachedFiles((prev) => [...prev, { id, name: file.name, size: file.size, type: file.type, file }]);
    setAttachedImages((prev) => [...prev, { id, mediaId: id, previewUrl: URL.createObjectURL(file) }]);
  };

  const removeAttachedImage = (id: string) => {
    const image = attachedImages.find((item) => item.id === id);
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    setAttachedImages((prev) => prev.filter((item) => item.id !== id));
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const submit = async () => {
    if (!props.isAuthenticated) {
      props.onRequireLogin();
      return;
    }

    if (!hasContent) {
      props.onToast("Escribe un mensaje o adjunta una imagen para publicar.", "info");
      return;
    }

    const payload: CreatePostSubmitPayload = {
      type: "publicacion",
      title,
      content,
      visibility,
      communityId,
      tags: [],
      attachedFiles,
      attachedImages,
    };

    try {
      await props.onSubmit(payload);
      resetForm();
      props.onClose();
    } catch {
      // La página muestra el mensaje de error de publicación.
    }
  };

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-sm" onClick={props.onClose}>
      <div
        role="dialog"
        aria-modal
        className="mx-auto mt-3 max-h-[93vh] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black">Crear publicación</h2>
            <p className="text-sm text-slate-500">Comparte en el feed general o en una comunidad.</p>
          </div>
          <button className="rounded-lg p-1 hover:bg-slate-100" onClick={props.onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
          {(
            [
              { id: "publicacion", icon: MessageSquarePlus, label: "Publicación" },
              { id: "apunte", icon: NotebookPen, label: "Apunte" },
              { id: "pregunta", icon: MessageCircle, label: "Pregunta" },
              { id: "momento", icon: Sparkles, label: "Momento" },
              { id: "debate", icon: AlignLeft, label: "Debate" },
              { id: "tramite", icon: FileUp, label: "Trámite" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === "publicacion") {
                  setType(id);
                  return;
                }
                if (id === "pregunta") {
                  props.onClose();
                  router.push("/app/preguntas/nuevo?returnUrl=/app");
                  return;
                }
                props.onToast(blockedMessages[id], "info");
              }}
              className={`rounded-xl border px-2 py-2 text-left ${type === id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"} ${id !== "publicacion" ? "opacity-70" : ""}`}
            >
              <Icon size={14} />
              <p className="text-xs font-semibold">{label}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="¿Qué quieres compartir?"
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold hover:border-indigo-300">
              Adjuntar imagen
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAttachImage(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <FeedAttachmentPreview files={[]} images={attachedImages} onRemoveImage={removeAttachedImage} />

          <select
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Feed general</option>
            {props.communities.map((community) => (
              <option key={community.id} value={String(community.id)}>
                {community.name}
              </option>
            ))}
          </select>

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "todos" | "comunidad")}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="todos">Visible para todos</option>
            <option value="comunidad">Solo en comunidad</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={props.onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
            onClick={submit}
          >
            {props.isAuthenticated ? "Publicar" : "Inicia sesión para publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}