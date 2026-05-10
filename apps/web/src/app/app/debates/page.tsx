"use client";

import { useMemo, useState } from "react";
import { StatusMessage } from "@/components/ui";
import { CreateDebateModal, DebateCard, DebateFilters, DebateModeSwitch, DebateSummaryModal, DebatesEmptyState, DebatesHeader, DebatesSidebar, ProposeTopicModal, ArgumentModal, debateCategories, mockDebates, DebateItem, DebateMode, DebateSort, DebateStatus, DebateTime } from "@/components/debates";

export default function DebatesPage() {
  const [items, setItems] = useState<DebateItem[]>(mockDebates);
  const [activeMode, setActiveMode] = useState<DebateMode>("academicos");
  const [activeTime, setActiveTime] = useState<DebateTime>("esta_semana");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [activeStatus, setActiveStatus] = useState<"todos" | DebateStatus>("todos");
  const [sortBy, setSortBy] = useState<DebateSort>("mas_comentados");
  const [toast, setToast] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [argumentDebate, setArgumentDebate] = useState<DebateItem | null>(null);
  const [summaryDebate, setSummaryDebate] = useState<DebateItem | null>(null);

  const visible = useMemo(() => items.filter((d) => d.mode === activeMode).filter((d) => activeCategory === "todos" || d.category === activeCategory).filter((d) => activeStatus === "todos" || d.status === activeStatus).sort((a, b) => sortBy === "mas_recientes" ? +new Date(b.createdAt) - +new Date(a.createdAt) : sortBy === "participacion" ? b.stats.participants - a.stats.participants : b.stats.responses - a.stats.responses), [items, activeMode, activeCategory, activeStatus, sortBy]);

  const stats = useMemo(() => {
    const modeItems = items.filter((d) => d.mode === activeMode);
    const responses = modeItems.reduce((acc, d) => acc + d.stats.responses, 0);
    const participants = modeItems.reduce((acc, d) => acc + d.stats.participants, 0);
    return [{ label: "Debates activos", value: `${modeItems.length}` }, { label: "Participación semanal", value: participants.toLocaleString("es-PE") }, { label: "Respuestas argumentadas", value: responses.toLocaleString("es-PE") }, { label: "Estudiantes activos", value: Math.max(1, Math.round(participants * 0.7)).toLocaleString("es-PE") }];
  }, [items, activeMode]);

  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2200); };

  return <section className="mx-auto max-w-[1540px] space-y-4 px-4 py-6 lg:px-6">{toast ? <StatusMessage type="success">{toast}</StatusMessage> : null}<DebatesHeader mode={activeMode} stats={stats} onCreate={() => setCreateOpen(true)} onPropose={() => setProposeOpen(true)} /><div className="grid gap-4 xl:grid-cols-12"><main className="space-y-4 xl:col-span-9"><DebateModeSwitch mode={activeMode} onChange={setActiveMode} /><DebateFilters mode={activeMode} time={activeTime} status={activeStatus} category={activeCategory} sortBy={sortBy} categories={debateCategories[activeMode]} onTime={setActiveTime} onStatus={setActiveStatus} onCategory={setActiveCategory} onSort={setSortBy} />{visible.length === 0 ? <DebatesEmptyState message={`No hay debates en ${activeCategory === "todos" ? "este filtro" : activeCategory} esta semana.`} onCreate={() => setCreateOpen(true)} /> : visible.map((debate) => <DebateCard key={debate.id} debate={debate} onPrimary={(d) => { if (d.status === "cerrado") return setSummaryDebate(d); if (!d.isJoined) { setItems((prev) => prev.map((item) => item.id === d.id ? { ...item, isJoined: true, stats: { ...item.stats, participants: item.stats.participants + 1 } } : item)); return notify("Te uniste al debate."); } setArgumentDebate(d); }} onSave={(d) => { setItems((prev) => prev.map((item) => item.id === d.id ? { ...item, isSaved: !item.isSaved } : item)); notify(d.isSaved ? "Debate quitado de guardados." : "Debate guardado."); }} onShare={async (d) => { await navigator.clipboard.writeText(`${window.location.origin}/app/debates/${d.id}`); notify("Enlace de debate copiado."); }} onMenu={async (d, action) => { if (action === "copiar") { await navigator.clipboard.writeText(`${window.location.origin}/app/debates/${d.id}`); notify("Enlace de debate copiado."); return; } notify(action === "reportar" ? "Debate reportado para revisión." : "Debate ocultado de tu feed."); }} />)}</main><div className="xl:col-span-3"><DebatesSidebar mode={activeMode} onSwitch={() => setActiveMode(activeMode === "academicos" ? "generales" : "academicos")} onTopic={(topic) => { setActiveCategory("todos"); notify(`Filtro aplicado por tema: ${topic}`); }} /></div></div><CreateDebateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(newDebate) => { setItems((prev) => [{ ...newDebate, id: `local-${Date.now()}`, createdAt: new Date().toISOString(), stats: { responses: 0, participants: 1, views: 0 }, highlightedArguments: [] }, ...prev]); notify("Debate creado correctamente."); }} /><ProposeTopicModal open={proposeOpen} onClose={() => setProposeOpen(false)} onSubmit={() => notify("Tu propuesta fue enviada para revisión.")} /><ArgumentModal debate={argumentDebate} onClose={() => setArgumentDebate(null)} onSubmit={(side, content) => { if (!argumentDebate) return; setItems((prev) => prev.map((item) => item.id === argumentDebate.id ? { ...item, stats: { ...item.stats, responses: item.stats.responses + 1 }, highlightedArguments: [{ id: `arg-${Date.now()}`, authorName: "Tú", side, content }, ...item.highlightedArguments] } : item)); notify("Argumento publicado."); }} /><DebateSummaryModal debate={summaryDebate} onClose={() => setSummaryDebate(null)} /></section>;
}
