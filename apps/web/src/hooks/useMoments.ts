"use client";

import { useMemo, useState } from "react";
import { fallbackMoments, fallbackNews } from "@/components/moments/moments-data";
import type { MomentComment, MomentItem, MomentNewsSummary, MomentView } from "@/components/moments/types";

const PREF_KEY = "crunedu_moments_default_view";
const DRAFT_KEY = "crunedu_moment_drafts";

export function useMoments() {
  const viewerAge: number | undefined = undefined; // TODO: connect real profile age from backend.
  const [moments, setMoments] = useState<MomentItem[]>(fallbackMoments);
  const [newsSummaries] = useState<MomentNewsSummary[]>(fallbackNews);
  const [comments, setComments] = useState<MomentComment[]>([]);
  const initialView = (typeof window !== "undefined" && (window.localStorage.getItem(PREF_KEY) as MomentView | null)) || (viewerAge !== undefined && viewerAge >= 35 ? "news" : "moments");
  const [activeView, setActiveViewState] = useState<MomentView>(initialView ?? "moments");
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filteredMoments = useMemo(() => moments.filter((m) => (activeView === "saved" ? m.viewerState.saved : new Date(m.expiresAt) > new Date() || m.viewerState.saved)).filter((m) => `${m.title} ${m.location ?? ""} ${m.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => score(b) - score(a)), [moments, activeView, query]);
  const currentMoment = filteredMoments[currentMomentIndex] ?? null;
  const savedMoments = moments.filter((m) => m.viewerState.saved);

  function setActiveView(view: MomentView) { setActiveViewState(view); if (typeof window !== "undefined") window.localStorage.setItem(PREF_KEY, view); }
  function mutateMoment(id: string, fn: (m: MomentItem) => MomentItem) { setMoments((all) => all.map((m) => (m.id === id ? fn(m) : m))); }
  function boostMoment(id: string) { mutateMoment(id, (m) => ({ ...m, stats: { ...m.stats, boosts: m.stats.boosts + (m.viewerState.boosted ? 0 : 1) }, viewerState: { ...m.viewerState, boosted: true } })); setToast("Momento impulsado."); }
  function passMoment(id: string) { mutateMoment(id, (m) => ({ ...m, viewerState: { ...m.viewerState, passed: true } })); setHistory((h) => [...new Set([id, ...h])]); nextMoment(); }
  function confirmMoment(id: string) { mutateMoment(id, (m) => ({ ...m, stats: { ...m.stats, confirmations: m.stats.confirmations + 1 }, viewerState: { ...m.viewerState, confirmed: true } })); }
  function saveMoment(id: string) { const target = moments.find((m) => m.id === id); const next = !target?.viewerState.saved; mutateMoment(id, (m) => ({ ...m, viewerState: { ...m.viewerState, saved: next } })); setToast(next ? "Momento guardado." : "Momento quitado de guardados."); }
  async function shareMoment(id: string) { const link = `/app/momentos/${id}`; if (typeof navigator !== "undefined" && navigator.clipboard) await navigator.clipboard.writeText(link); setToast("Enlace copiado."); }
  function commentMoment(momentId: string, content: string) { setComments((v) => [{ id: `${Date.now()}`, momentId, content, author: "Tú", createdAt: new Date().toISOString() }, ...v]); mutateMoment(momentId, (m) => ({ ...m, stats: { ...m.stats, comments: m.stats.comments + 1 } })); }
  function createMoment(input: Pick<MomentItem, "title" | "description" | "location" | "type" | "tags" | "media"> & { durationHours: number }) { const item: MomentItem = { id: `local-${Date.now()}`, title: input.title, description: input.description, location: input.location, type: input.type, tags: input.tags, media: input.media, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + input.durationHours * 3600_000).toISOString(), author: { id: "local", name: "Tú" }, stats: { boosts: 0, confirmations: 0, comments: 0, shares: 0, views: 0 }, viewerState: { boosted: false, passed: false, saved: false, confirmed: false }, status: "active" }; setMoments((v) => [item, ...v]); setToast("Momento publicado."); }
  function saveDraft(payload: unknown) { if (typeof window !== "undefined") { const current = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "[]"); window.localStorage.setItem(DRAFT_KEY, JSON.stringify([payload, ...current].slice(0, 20))); setToast("Borrador guardado."); } }
  function openDetails(id: string) { return `/app/momentos/${id}`; }
  function selectFromHistory(id: string) { const idx = filteredMoments.findIndex((m) => m.id === id); if (idx >= 0) setCurrentMomentIndex(idx); }
  function nextMoment() { setCurrentMomentIndex((v) => (filteredMoments.length ? (v + 1) % filteredMoments.length : 0)); }
  function previousMoment() { setCurrentMomentIndex((v) => (filteredMoments.length ? (v - 1 + filteredMoments.length) % filteredMoments.length : 0)); }

  return { moments, newsSummaries, activeView, setActiveView, currentMomentIndex, currentMoment, history, savedMoments, filteredMoments, query, setQuery, boostMoment, passMoment, confirmMoment, saveMoment, shareMoment, commentMoment, createMoment, saveDraft, openDetails, selectFromHistory, nextMoment, previousMoment, comments, toast, setToast };
}

function score(moment: MomentItem) { const hours = (Date.now() - new Date(moment.createdAt).getTime()) / 3600_000; return moment.stats.boosts * 3 + moment.stats.confirmations * 4 + moment.stats.comments * 2 - hours * 5; }
