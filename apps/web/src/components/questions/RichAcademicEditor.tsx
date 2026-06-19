"use client";

import { ChangeEvent, useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { EquationPicker } from "./EquationPicker";
import { SymbolPicker } from "./SymbolPicker";
import { escapePlainText, htmlToPlainText, looksLikeHtml } from "./html-utils";

export type AcademicComposerImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type RichAcademicEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  maxLength?: number;
  allowImages?: boolean;
  images?: AcademicComposerImage[];
  onImagesChange?: (images: AcademicComposerImage[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  mode: "question" | "answer";
  label?: string;
  templates?: boolean;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

export function RichAcademicEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  allowImages = true,
  images = [],
  onImagesChange,
  onError,
  disabled,
  mode,
  label,
  templates = false,
}: RichAcademicEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const lastEmittedRef = useRef<string>("");
  const [charCount, setCharCount] = useState(0);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [equationOpen, setEquationOpen] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value !== lastEmittedRef.current) {
      const safe = value ? (looksLikeHtml(value) ? value : escapePlainText(value)) : "";
      editor.innerHTML = safe;
      lastEmittedRef.current = value;
      setCharCount(htmlToPlainText(editor.innerHTML).length);
    }
  }, [value]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.innerHTML;
    lastEmittedRef.current = html;
    if (maxLength) {
      const plain = htmlToPlainText(html);
      if (plain.length > maxLength) {
        setCharCount(plain.length);
        return;
      }
    }
    onChange(html);
    setCharCount(htmlToPlainText(html).length);
  }

  function preserveFocus(callback: () => void) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (disabled) return;
      callback();
    };
  }

  function exec(command: string) {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    editor.focus();
    document.execCommand(command, false);
    emitChange();
  }

  function insertTextAtCursor(text: string) {
    const editor = editorRef.current;
    if (!editor || disabled) return;
    editor.focus();
    const inserted = document.execCommand("insertText", false, text);
    if (!inserted) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    emitChange();
  }

  function applyTemplate(template: string) {
    insertTextAtCursor(template);
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

  function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    insertTextAtCursor(text);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      exec("insertParagraph");
    }
  }

  const isEmpty = charCount === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      {label ? <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label> : null}

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1 text-xs font-bold text-slate-700">
          <ToolbarButton label="B" title="Negrita (Ctrl+B)" italic={false} onMouseDown={preserveFocus(() => exec("bold"))} disabled={disabled} className="font-black" />
          <ToolbarButton label="I" title="Cursiva (Ctrl+I)" italic onMouseDown={preserveFocus(() => exec("italic"))} disabled={disabled} />
          <ToolbarButton label="U" title="Subrayado" onMouseDown={preserveFocus(() => exec("underline"))} disabled={disabled} className="underline" />
          <ToolbarDivider />
          <ToolbarButton label="• Lista" title="Lista con viñetas" onMouseDown={preserveFocus(() => exec("insertUnorderedList"))} disabled={disabled} />
          <ToolbarButton label="1. Lista" title="Lista numerada" onMouseDown={preserveFocus(() => exec("insertOrderedList"))} disabled={disabled} />
          <ToolbarDivider />
          <ToolbarButton label="Ω" title="Insertar símbolo" onMouseDown={preserveFocus(() => { setSymbolOpen((v) => !v); setEquationOpen(false); })} disabled={disabled} />
          <ToolbarButton label="ƒx" title="Insertar ecuación" onMouseDown={preserveFocus(() => { setEquationOpen((v) => !v); setSymbolOpen(false); })} disabled={disabled} />
          {allowImages ? <ToolbarButton label="Imagen" title="Adjuntar imagen" onMouseDown={preserveFocus(() => imageInputRef.current?.click())} disabled={disabled} /> : null}
        </div>
        {maxLength ? <span className={`whitespace-nowrap text-xs font-semibold ${charCount > maxLength ? "text-rose-600" : "text-slate-500"}`}>{charCount}/{maxLength}</span> : null}
      </div>

      {templates ? (
        <div className="mb-2 flex flex-wrap gap-1">
          <button type="button" disabled={disabled} onMouseDown={preserveFocus(() => applyTemplate("Respuesta final: "))} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 disabled:opacity-50">Respuesta final</button>
          <button type="button" disabled={disabled} onMouseDown={preserveFocus(() => applyTemplate("Procedimiento o explicación: "))} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-indigo-50 disabled:opacity-50">Procedimiento</button>
        </div>
      ) : null}

      <div className="relative">
        {symbolOpen ? (
          <SymbolPicker open={symbolOpen} onInsert={(symbol) => { insertTextAtCursor(symbol); }} onClose={() => setSymbolOpen(false)} />
        ) : null}
        {equationOpen ? (
          <EquationPicker open={equationOpen} onInsert={(text) => { insertTextAtCursor(text); }} onClose={() => setEquationOpen(false)} />
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label={label ?? placeholder}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          className={`prose-academic min-h-36 w-full resize-y overflow-y-auto rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-base ${disabled ? "bg-slate-50 text-slate-500" : "bg-white text-slate-800"} ${isEmpty ? "before:text-slate-400 before:content-[attr(data-placeholder)]" : ""}`}
        />
      </div>

      {allowImages ? (
        <div className="mt-3">
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImagesSelected} className="hidden" />
          {images.length ? (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {images.map((image) => (
                <div key={image.id} className="relative overflow-hidden rounded-xl border">
                  <img src={image.previewUrl} alt="Vista previa" className="h-40 w-full object-cover" />
                  <button type="button" onClick={() => removeImage(image.id)} className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Quitar</button>
                </div>
              ))}
            </div>
          ) : (
            <button type="button" disabled={disabled} onClick={() => imageInputRef.current?.click()} className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 disabled:bg-slate-100">Adjuntar imagen</button>
          )}
          <p className="mt-1 text-xs text-slate-500">Hasta 4 imágenes JPG, PNG o WEBP. Máximo 3MB cada una.</p>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({ label, title, onMouseDown, disabled, italic, className = "" }: { label: string; title: string; onMouseDown: (event: MouseEvent<HTMLButtonElement>) => void; disabled?: boolean; italic?: boolean; className?: string }) {
  return <button type="button" title={title} onMouseDown={onMouseDown} disabled={disabled} className={`whitespace-nowrap rounded-lg px-2 py-1 hover:bg-white hover:shadow-sm disabled:opacity-50 ${italic ? "italic" : ""} ${className}`}>{label}</button>;
}

function ToolbarDivider() {
  return <span className="mx-1 inline-block h-4 w-px bg-slate-300" aria-hidden="true" />;
}
