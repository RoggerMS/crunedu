"use client";

import { RichAcademicEditor, type AcademicComposerImage } from "./RichAcademicEditor";

export type { AcademicComposerImage };

type AcademicComposerMode = "question" | "answer";

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
  templates?: boolean;
};

export function AcademicComposer({ mode, templates, ...rest }: AcademicComposerProps) {
  return <RichAcademicEditor mode={mode} templates={templates ?? mode === "answer"} {...rest} />;
}
