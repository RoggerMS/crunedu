"use client";

import { FormEvent, useMemo, useState } from "react";
import { ModuleHeader } from "@/components/module-header";
import { PageState } from "@/components/ui";

type ProcedureContentType = "official-guide" | "student-experience" | "procedure-question";
type ProcedureTemplateKey = "matricula" | "carne" | "comedor" | "constancias";
type ProcedureStatus = "informative" | "active" | "changed";

type ProcedureAlert = {
  id: number;
  procedure: string;
  message: string;
  updatedAt: string;
};

type TemplateConfig = {
  label: string;
  title: string;
  content: string;
};

const CONTENT_TYPE_OPTIONS: Array<{ value: ProcedureContentType; label: string; helper: string }> = [
  { value: "official-guide", label: "Guía oficial", helper: "Resume pasos validados para un trámite." },
  { value: "student-experience", label: "Experiencia estudiantil", helper: "Comparte qué funcionó y qué evitar." },
  { value: "procedure-question", label: "Pregunta de trámite", helper: "Publica tu duda sin salir de esta sección." },
];

const STATUS_OPTIONS: Array<{ value: ProcedureStatus; label: string }> = [
  { value: "informative", label: "Informativo" },
  { value: "active", label: "Vigente" },
  { value: "changed", label: "Cambiado" },
];

const TEMPLATES: Record<ProcedureTemplateKey, TemplateConfig> = {
  matricula: {
    label: "Matrícula",
    title: "Matrícula 2026-I: pasos y requisitos",
    content: "1) Revisa cronograma\n2) Confirma tus cursos\n3) Adjunta comprobantes\n4) Verifica tu constancia final",
  },
  carne: {
    label: "Carné universitario",
    title: "Renovación de carné universitario",
    content: "1) Valida tus datos personales\n2) Sube foto actualizada\n3) Paga el derecho\n4) Consulta fecha de entrega",
  },
  comedor: {
    label: "Comedor",
    title: "Solicitud de acceso al comedor universitario",
    content: "1) Reúne documentos socioeconómicos\n2) Registra solicitud\n3) Espera evaluación\n4) Revisa listado de admitidos",
  },
  constancias: {
    label: "Constancias",
    title: "Cómo solicitar constancias académicas",
    content: "1) Identifica tipo de constancia\n2) Realiza pago en caja\n3) Presenta solicitud\n4) Confirma fecha de recojo",
  },
};

const RECENT_ALERTS: ProcedureAlert[] = [
  {
    id: 1,
    procedure: "Matrícula",
    message: "Se movió el cierre de regularización para el 15 de mayo.",
    updatedAt: "hace 2 horas",
  },
  {
    id: 2,
    procedure: "Carné universitario",
    message: "Ahora solicitan foto con fondo blanco obligatorio.",
    updatedAt: "hace 1 día",
  },
  {
    id: 3,
    procedure: "Comedor",
    message: "Publicaron nuevo formato de declaración jurada.",
    updatedAt: "hace 3 días",
  },
];

export default function ProceduresPage() {
  const [contentType, setContentType] = useState<ProcedureContentType>("procedure-question");
  const [templateKey, setTemplateKey] = useState<ProcedureTemplateKey>("matricula");
  const [status, setStatus] = useState<ProcedureStatus>("informative");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentTypeHelper = useMemo(
    () => CONTENT_TYPE_OPTIONS.find((item) => item.value === contentType)?.helper ?? "",
    [contentType],
  );

  function applyTemplate() {
    const selectedTemplate = TEMPLATES[templateKey];
    setTitle(selectedTemplate.title);
    setContent(selectedTemplate.content);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitted(true);
    setTitle("");
    setContent("");
  }

  return (
    <section className="space-y-6">
      <ModuleHeader title="Trámites" description="Resuelve trámites con ayuda de experiencias reales de estudiantes." />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-amber-700">Alertas recientes por trámite</h2>
        <ul className="mt-3 space-y-2">
          {RECENT_ALERTS.map((alert) => (
            <li key={alert.id} className="rounded-xl border border-amber-100 bg-white p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{alert.procedure}</p>
              <p>{alert.message}</p>
              <p className="mt-1 text-xs text-slate-500">Actualizado {alert.updatedAt}</p>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-black">Publicar trámite sin salir de esta sección</h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Tipo de contenido</label>
          <select
            value={contentType}
            onChange={(event) => setContentType(event.target.value as ProcedureContentType)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600">{currentTypeHelper}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Plantilla rápida</label>
            <select
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value as ProcedureTemplateKey)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              {Object.entries(TEMPLATES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Estado del trámite</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProcedureStatus)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" onClick={applyTemplate} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
          Usar plantilla seleccionada
        </button>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Título del trámite"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3"
          placeholder="Describe el proceso o tu duda"
        />
        <button type="submit" className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Publicar trámite</button>
        {submitted ? (
          <p className="text-sm text-emerald-700">
            Tu publicación de trámite quedó preparada con estado <span className="font-semibold">{STATUS_OPTIONS.find((item) => item.value === status)?.label}</span>.
          </p>
        ) : null}
      </form>

      <PageState
        type="empty"
        title="No hay guías activas por ahora"
        description="Publica una guía breve o una consulta específica para reunir experiencias reales del proceso."
      />
    </section>
  );
}
