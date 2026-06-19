"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createCommunity } from "@/lib/api-helpers";
import { buildLoginHref } from "@/lib/auth-routes";
import { mapApiError } from "@/lib/http-client";

type PrivacyValue = "publica" | "privada";
type Step = 1 | 2;

function FloatingField({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-slate-300 bg-white px-3 pt-5 pb-2.5 transition-all duration-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
      <span
        className={`pointer-events-none absolute left-3 rounded bg-white px-1 transition-all duration-200 ${
          active
            ? "top-0 text-[11px] font-semibold text-indigo-600"
            : "top-1/2 -translate-y-1/2 px-0 text-sm text-slate-400"
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

const previewTransition = "transition-all duration-300";

export default function NewCommunityPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyValue | "">("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const loginHref = buildLoginHref("/app/comunidades/nueva");

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const trimmedRules = rules.trim();
  const canContinue = trimmedName.length > 0 && Boolean(privacy);
  const avatarInitial = (trimmedName.trim().charAt(0) || "C").toUpperCase();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      if (canContinue) setStep(2);
      return;
    }
    if (!canContinue) return;
    if (!isAuthenticated || !accessToken) return setFormError("Inicia sesión para crear una comunidad.");
    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await createCommunity({ name: trimmedName, description: trimmedDescription || undefined, rules: trimmedRules || undefined }, accessToken);
      router.push(`/app/comunidades/${created.id}`);
      router.refresh();
    } catch (error) {
      setFormError(mapApiError(error, "No se pudo crear la comunidad."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-slate-100 px-4 py-4 sm:px-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/comunidades" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" aria-label="Volver a comunidades">
            <X size={18} />
          </Link>
          <span className="inline-flex items-center gap-2 text-xl font-black text-slate-900"><GraduationCap size={20} className="text-indigo-600" />CrunEdu</span>
        </div>
      </header>

      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-3xl bg-white p-5 shadow-sm xl:h-[calc(100vh-104px)] xl:overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">Crear comunidad</h1>
            {step === 1 ? (
              <>
                <FloatingField label="Nombre de la comunidad" active={Boolean(name)}><input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm outline-none" maxLength={80} required /></FloatingField>
                <FloatingField label="Privacidad" active={Boolean(privacy)}>
                  <select value={privacy} onChange={(e) => setPrivacy(e.target.value as PrivacyValue)} className="w-full bg-transparent text-sm outline-none">
                    <option value="" />
                    <option value="publica">Pública</option>
                    <option value="privada">Privada</option>
                  </select>
                </FloatingField>
                <FloatingField label="Descripción" active={Boolean(description)}><textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={4} className="w-full resize-none bg-transparent text-sm outline-none" /></FloatingField>
                <div className="flex items-center justify-between pt-2">
                  <Link href="/app/comunidades" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancelar</Link>
                  <button type="submit" disabled={!canContinue} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Siguiente</button>
                </div>
              </>
            ) : (
              <>
                <FloatingField label="Reglas (opcional)" active={Boolean(rules)}><textarea value={rules} onChange={(e) => setRules(e.target.value.slice(0, 500))} rows={5} placeholder="Una regla por línea" className="w-full resize-none bg-transparent text-sm outline-none" /></FloatingField>
                {formError ? (
                  <p className="text-sm text-red-700">
                    {formError}
                    {formError.includes("Inicia sesión") ? (
                      <Link href={loginHref} className="ml-2 font-semibold text-indigo-700 underline">
                        Iniciar sesión
                      </Link>
                    ) : null}
                  </p>
                ) : null}
                <div className="flex items-center justify-between pt-2"><button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Atrás</button><button type="submit" disabled={isSubmitting || !canContinue} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Creando..." : "Crear comunidad"}</button></div>
              </>
            )}
          </form>
        </section>

        <aside className="rounded-3xl bg-white p-4 shadow-sm">
          <article className="rounded-3xl border border-slate-200">
            <div className="relative h-64">
              <div className={`h-full rounded-t-3xl bg-slate-200 opacity-60 ${previewTransition}`} />
              <div className="absolute -bottom-10 left-6 z-20 grid h-24 w-24 place-items-center rounded-2xl border-4 border-white bg-indigo-100 text-3xl font-black text-indigo-700">
                {avatarInitial}
              </div>
            </div>
            <div className="px-6 pb-6 pt-14">
              <h2 className={`text-3xl font-black text-slate-900 ${trimmedName ? "opacity-100" : "opacity-45"} ${previewTransition}`}>{trimmedName || "Nombre de la comunidad"}</h2>
              <p className={`mt-1 text-sm text-slate-600 ${privacy ? "opacity-100" : "opacity-45"} ${previewTransition}`}>{privacy ? (privacy === "publica" ? "Pública" : "Privada") : "Privacidad"}</p>
              <p className={`mt-3 text-sm text-slate-600 ${trimmedDescription ? "opacity-100" : "opacity-45"} ${previewTransition}`}>{trimmedDescription || "La descripción aparecerá aquí."}</p>
              <div className="mt-4 flex gap-2 text-xs font-semibold text-slate-500">{["Información", "Publicaciones", "Miembros"].map((tab) => <span key={tab} className="rounded-full bg-slate-100 px-3 py-1 opacity-70">{tab}</span>)}</div>
              {trimmedRules ? <div className="mt-4 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">Reglas</p><p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{trimmedRules}</p></div> : null}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
