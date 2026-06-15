"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AcademicContentRenderer } from "./AcademicContentRenderer";

type AcademicComposerMode = "question" | "answer";

export type AcademicComposerImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type AcademicComposerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
  allowImages?: boolean;
  images?: AcademicComposerImage[];
  onImagesChange?: (images: AcademicComposerImage[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  mode: AcademicComposerMode;
  label?: string;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

export function AcademicComposer({ value, onChange, placeholder, maxLength, allowImages = true, images = [], onImagesChange, onError, disabled, mode, label }: AcademicComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  function insertText(before: string, after = "", fallback = "texto") {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(maxLength ? nextValue.slice(0, maxLength) : nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertList(prefix: "- " | "1. ") {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || (prefix === "- " ? "primer punto" : "primer paso");
    const lines = selected.split("\n").map((line, index) => {
      const cleanLine = line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, "");
      return prefix === "- " ? `- ${cleanLine}` : `${index + 1}. ${cleanLine}`;
    });
    const nextValue = `${value.slice(0, start)}${lines.join("\n")}${value.slice(end)}`;
    onChange(maxLength ? nextValue.slice(0, maxLength) : nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + lines.join("\n").length);
    });
  }

  function insertCharacter(character: string) {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}${character}${value.slice(end)}`;
    onChange(maxLength ? nextValue.slice(0, maxLength) : nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + character.length, start + character.length);
    });
  }

  function onImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_SIZE_BYTES);
    if (validFiles.length !== files.length) onError?.("Solo puedes adjuntar imágenes JPG, PNG o WEBP de hasta 3MB.");
    const availableSlots = Math.max(0, MAX_IMAGES - images.length);
    if (availableSlots === 0) onError?.(`Solo puedes adjuntar hasta ${MAX_IMAGES} imágenes.`);
    const nextImages = [
      ...images,
      ...validFiles.slice(0, availableSlots).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ];
    onImagesChange?.(nextImages);
    event.target.value = "";
  }

  function removeImage(id: string) {
    const image = images.find((item) => item.id === id);
    if (image) URL.revokeObjectURL(image.previewUrl);
    onImagesChange?.(images.filter((item) => item.id !== id));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      {label ? <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label> : null}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button type="button" onClick={() => setActiveTab("write")} className={`rounded-lg px-3 py-1 ${activeTab === "write" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>Escribir</button>
          <button type="button" onClick={() => setActiveTab("preview")} className={`rounded-lg px-3 py-1 ${activeTab === "preview" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}>Vista previa</button>
        </div>
        {maxLength ? <span className="text-xs font-semibold text-slate-500">{value.length}/{maxLength}</span> : null}
      </div>
      <div className="mb-2 flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1 text-xs font-semibold text-slate-700">
        <ToolbarButton label="B Negrita" title="Negrita" onClick={() => insertText("**", "**", "texto en negrita")} disabled={disabled || activeTab === "preview"} />
        <ToolbarButton label="I Cursiva" title="Cursiva" onClick={() => insertText("*", "*", "texto en cursiva")} disabled={disabled || activeTab === "preview"} italic />
        <ToolbarButton label="S Tachado" title="Tachado" onClick={() => insertText("~~", "~~", "texto tachado")} disabled={disabled || activeTab === "preview"} strike />
        <ToolbarButton label="• Lista" title="Lista con viñetas" onClick={() => insertList("- ")} disabled={disabled || activeTab === "preview"} />
        <ToolbarButton label="1. Lista" title="Lista numerada" onClick={() => insertList("1. ")} disabled={disabled || activeTab === "preview"} />
        <ToolbarButton label="x²" title="Superíndice" onClick={() => insertCharacter("²")} disabled={disabled || activeTab === "preview"} />
        <ToolbarButton label="H₂" title="Subíndice" onClick={() => insertCharacter("₂")} disabled={disabled || activeTab === "preview"} />
      </div>
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(maxLength ? event.target.value.slice(0, maxLength) : event.target.value)}
          maxLength={maxLength}
          disabled={disabled}
          rows={mode === "question" ? 10 : 6}
          placeholder={placeholder}
          className="min-h-36 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        />
      ) : (
        <div className="min-h-36 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          {value.trim() || images.length ? <AcademicContentRenderer content={value} images={images} imageAlt="Vista previa de imagen adjunta" smallImages={mode === "answer"} /> : <p className="text-sm text-slate-500">Escribe contenido para ver la vista previa antes de publicar.</p>}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">Ayuda: selecciona texto y usa la barra, o escribe **negrita**, *cursiva*, ~~tachado~~, &quot;- &quot; para viñetas y &quot;1. &quot; para pasos.</p>
      {allowImages ? (
        <div className="mt-3">
          <button type="button" disabled={disabled} onClick={() => imageInputRef.current?.click()} className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 disabled:bg-slate-100">
            Adjuntar imagen
          </button>
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImagesSelected} className="hidden" />
          <p className="mt-1 text-xs text-slate-500">Hasta 4 imágenes JPG, PNG o WEBP. Máximo 3MB cada una.</p>
          {images.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-xl border"><img src={image.previewUrl} alt="Vista previa" className="h-40 w-full object-cover" /><button type="button" onClick={() => removeImage(image.id)} className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Quitar</button></div>)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({ label, title, onClick, disabled, italic, strike }: { label: string; title: string; onClick: () => void; disabled?: boolean; italic?: boolean; strike?: boolean }) {
  return <button type="button" title={title} disabled={disabled} onClick={onClick} className={`rounded-lg px-2 py-1 hover:bg-white hover:shadow-sm disabled:opacity-50 ${italic ? "italic" : ""} ${strike ? "line-through" : ""}`}>{label}</button>;
}
