"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createCommunity } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

type PrivacyValue = "publica" | "privada";
type Step = 1 | 2;

type InviteSuggestion = { id: string; name: string; handle: string };
const INVITE_SUGGESTIONS: InviteSuggestion[] = [
  { id: "1", name: "Pablo González", handle: "@pablogonzalez22" },
  { id: "2", name: "Pablo Andrés", handle: "@pabloandres" },
  { id: "3", name: "Pablo Martínez", handle: "@pmartinez" },
  { id: "4", name: "Paola Barrera", handle: "@paolabarrera" },
];

const inactiveBlock = "grayscale-[0.8] opacity-50 blur-[0.4px] transition-all duration-300";
const activeBlock = "opacity-100 grayscale-0 blur-0 transition-all duration-300";

function FloatingField({ label, active, children }: { label: string; active: boolean; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-slate-300 bg-white px-3 pt-5 pb-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
      <span
        className={`pointer-events-none absolute left-3 transition-all duration-200 ${
          active
            ? "top-1.5 text-[11px] font-semibold text-slate-500 focus-within:text-indigo-600"
            : "top-1/2 -translate-y-1/2 text-sm text-slate-400"
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export default function NewCommunityPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyValue | "">("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [invitedPeople, setInvitedPeople] = useState<InviteSuggestion[]>([]);
  const [showInviteDropdown, setShowInviteDropdown] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inviteWrapperRef = useRef<HTMLDivElement | null>(null);

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const trimmedRules = rules.trim();
  const canContinue = trimmedName.length > 0 && Boolean(privacy);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!inviteWrapperRef.current?.contains(event.target as Node)) setShowInviteDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = useMemo(() => {
    const query = inviteInput.trim().toLowerCase();
    return INVITE_SUGGESTIONS.filter((s) => {
      if (invitedPeople.some((selected) => selected.id === s.id)) return false;
      return !query || s.name.toLowerCase().includes(query) || s.handle.toLowerCase().includes(query);
    });
  }, [inviteInput, invitedPeople]);

  function appendTag(rawTag: string) {
    const cleanTag = rawTag.trim().replace(/^#/, "");
    if (!cleanTag) return;
    setTags((prev) => (prev.includes(cleanTag) ? prev : [...prev, cleanTag].slice(0, 10)));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") {
    const file = event.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    if (type === "avatar") setAvatarPreview(localPreview);
    else setCoverPreview(localPreview);
  }

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
    <main className="min-h-screen bg-slate-100">
      <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/app/comunidades" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700">✕</Link>
          <span className="text-lg font-black text-slate-900">CrunEdu</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full border border-slate-300 bg-white p-2">🔔</button>
          <button type="button" className="rounded-full border border-slate-300 bg-white p-2">👤</button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className="rounded-3xl bg-white p-5 shadow-sm xl:h-[calc(100vh-112px)] xl:overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">Crear comunidad</h1>
            {step === 1 ? (
              <>
                <FloatingField label="Nombre de la comunidad" active={Boolean(name)}>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent text-sm outline-none" maxLength={80} required />
                </FloatingField>
                <FloatingField label="Privacidad" active={Boolean(privacy)}>
                  <select value={privacy} onChange={(e) => setPrivacy(e.target.value as PrivacyValue)} className="w-full bg-transparent text-sm outline-none">
                    <option value="">Elegir privacidad</option><option value="publica">Pública</option><option value="privada">Privada</option>
                  </select>
                </FloatingField>
                <FloatingField label="Descripción" active={Boolean(description)}>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={4} className="w-full resize-none bg-transparent text-sm outline-none" />
                </FloatingField>
                <div className="flex items-center justify-between pt-2">
                  <Link href="/app/comunidades" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Cancelar</Link>
                  <button type="submit" disabled={!canContinue} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Siguiente</button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 p-3 text-center text-sm">📷 Imagen de la comunidad<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "avatar")} /></label>
                  <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 p-3 text-center text-sm">🖼️ Imagen de portada<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "cover")} /></label>
                </div>
                <FloatingField label="Etiquetas" active={Boolean(tagInput) || tags.length > 0}>
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); appendTag(tagInput); setTagInput(""); }}} onBlur={() => { if (tagInput.trim()) { appendTag(tagInput); setTagInput(""); }}} className="w-full bg-transparent text-sm outline-none" />
                </FloatingField>
                <FloatingField label="Reglas de la comunidad" active={Boolean(rules)}>
                  <textarea value={rules} onChange={(e) => setRules(e.target.value.slice(0, 500))} rows={4} className="w-full resize-none bg-transparent text-sm outline-none" />
                </FloatingField>
                <div ref={inviteWrapperRef} className="space-y-2">
                  <FloatingField label="Invitar amigos" active={Boolean(inviteInput) || invitedPeople.length > 0}>
                    <input value={inviteInput} onChange={(e) => { setInviteInput(e.target.value); setShowInviteDropdown(true); }} onFocus={() => setShowInviteDropdown(true)} className="w-full bg-transparent text-sm outline-none" />
                  </FloatingField>
                  <p className="text-xs text-slate-500">Puedes invitarlos ahora o hacerlo después.</p>
                  {showInviteDropdown && filteredSuggestions.length > 0 ? <div className="rounded-xl border border-slate-200 bg-white p-2">{filteredSuggestions.map((p) => <button key={p.id} type="button" className="block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-50" onClick={() => { setInvitedPeople((prev) => [...prev, p]); setInviteInput(""); setShowInviteDropdown(false); }}>{p.name} <span className="text-xs text-slate-500">{p.handle}</span></button>)}</div> : null}
                </div>
                {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Atrás</button>
                  <button type="submit" disabled={isSubmitting || !canContinue} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting ? "Creando..." : "Crear comunidad"}</button>
                </div>
              </>
            )}
          </form>
        </section>

        <aside className="rounded-3xl bg-white p-4 shadow-sm">
          <article className="overflow-visible rounded-3xl border border-slate-200">
            <div className={`relative h-56 ${coverPreview ? activeBlock : inactiveBlock}`}>
              {coverPreview ? <img src={coverPreview} alt="Portada" className="h-full w-full rounded-t-3xl object-cover" /> : <div className="h-full w-full rounded-t-3xl bg-slate-300" />}
              <div className="absolute -bottom-10 left-6 z-20">
                <div className={`h-24 w-24 overflow-hidden rounded-2xl border-4 border-white ${avatarPreview ? activeBlock : inactiveBlock}`}>
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-slate-300" />}
                </div>
              </div>
            </div>
            <div className="px-6 pt-14 pb-6">
              <h2 className={`text-3xl font-black ${trimmedName ? activeBlock : inactiveBlock}`}>{trimmedName || "Nombre de la comunidad"}</h2>
              <p className={`mt-1 text-sm ${privacy ? activeBlock : inactiveBlock}`}>{privacy ? (privacy === "publica" ? "Pública" : "Privada") : "Elegir privacidad"}</p>
              <p className={`mt-3 text-sm text-slate-600 ${trimmedDescription ? activeBlock : inactiveBlock}`}>{trimmedDescription || "La descripción aparecerá aquí."}</p>
              <div className="mt-4 flex gap-2 text-xs font-semibold text-slate-500">{["Información", "Publicaciones", "Miembros", "Eventos"].map((tab) => <span key={tab} className="rounded-full bg-slate-100 px-3 py-1">{tab}</span>)}</div>
              <div className={`mt-4 rounded-2xl border border-slate-200 p-4 ${trimmedName ? activeBlock : inactiveBlock}`}><p className="text-sm text-slate-500">Escribe tu primera publicación...</p></div>
              {(trimmedRules || tags.length > 0) && <div className="mt-4 rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">Información de la comunidad</p>{trimmedRules ? <p className="mt-2 text-xs text-slate-600">{trimmedRules}</p> : null}{tags.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">#{tag}</span>)}</div> : null}</div>}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
