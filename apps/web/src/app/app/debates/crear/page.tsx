"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, PrimaryButton, SecondaryButton, StatusMessage, TextArea } from "@/components/ui";
import { useAccessToken } from "@/hooks/useAccessToken";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { debateCourseCatalog } from "@/modules/debates/courseCatalog";
import { debateTaxonomy, DebateScope } from "@/modules/debates/debateTaxonomy";

export default function CreateDebatePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [scope, setScope] = useState<DebateScope | "">("");
  const [categoryKey, setCategoryKey] = useState("");
  const [courseKey, setCourseKey] = useState("");
  const [weeklyTopic, setWeeklyTopic] = useState("");
  const [stance, setStance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => debateTaxonomy.filter((item) => (!scope ? true : item.scope === scope)), [scope]);
  const selectedCategory = useMemo(() => categories.find((item) => item.key === categoryKey), [categories, categoryKey]);

  const subcategories = useMemo(() => {
    const base = debateCourseCatalog.filter((course) => (!scope ? true : course.scope === scope));
    if (!selectedCategory) return [];
    return base;
  }, [scope, selectedCategory]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setError("Inicia sesión para publicar un debate.");
      return;
    }
    if (!scope || !categoryKey || !courseKey) {
      setError("Completa tipo, categoría y subcategoría antes de publicar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest("/debates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseKey,
          weeklyTopic,
          stance,
        }),
      });
      router.push(`/app/debates?created=1`);
    } catch (err) {
      setError(mapApiError(err, "No se pudo publicar el debate."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <Card className="space-y-2 bg-gradient-to-r from-indigo-50 to-sky-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Nuevo debate</p>
        <h1 className="text-2xl font-black text-slate-900">Crea y publica tu debate</h1>
        <p className="text-sm text-slate-600">Elige claramente el tipo, categoría y subcategoría para que todos encuentren mejor tu tema.</p>
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">1) ¿Tu debate es académico o no académico?</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setScope("academic"); setCategoryKey(""); setCourseKey(""); }} className={`rounded-full border px-4 py-2 text-sm ${scope === "academic" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300"}`}>Académico</button>
              <button type="button" onClick={() => { setScope("non-academic"); setCategoryKey(""); setCourseKey(""); }} className={`rounded-full border px-4 py-2 text-sm ${scope === "non-academic" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300"}`}>No académico</button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">2) Elige una categoría</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <button key={category.key} type="button" onClick={() => { setCategoryKey(category.key); setCourseKey(""); }} className={`rounded-lg border px-3 py-2 text-left text-sm ${categoryKey === category.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700"}`}>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">3) Elige subcategoría</p>
            {!categoryKey ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">Primero selecciona una categoría para habilitar subcategorías.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {subcategories.map((course) => (
                  <button key={course.key} type="button" onClick={() => setCourseKey(course.key)} className={`rounded-lg border px-3 py-2 text-left text-sm ${courseKey === course.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700"}`}>
                    {course.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <TextArea value={weeklyTopic} onChange={(event) => setWeeklyTopic(event.target.value)} rows={2} maxLength={160} placeholder="Título del debate" required />
          <TextArea value={stance} onChange={(event) => setStance(event.target.value)} rows={5} maxLength={1500} placeholder="Explica tu postura inicial" required />

          {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <SecondaryButton asChild><Link href="/app/debates">Cancelar</Link></SecondaryButton>
            {!isAuthenticated ? <SecondaryButton asChild><Link href="/login">Iniciar sesión</Link></SecondaryButton> : null}
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Publicando..." : "Publicar debate"}</PrimaryButton>
          </div>
        </form>
      </Card>
    </main>
  );
}
