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

type InviteSuggestion = {
  id: string;
  name: string;
  handle: string;
};

const INVITE_SUGGESTIONS: InviteSuggestion[] = [
  { id: "1", name: "Pablo González", handle: "@pablogonzalez22" },
  { id: "2", name: "Pablo Andrés", handle: "@pabloandres" },
  { id: "3", name: "Pablo Martínez", handle: "@pmartinez" },
  { id: "4", name: "Paola Barrera", handle: "@paolabarrera" },
];

function getInitials(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return "T";
  return cleanName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function parseUserNameFromToken(token: string) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "Tú";
    const payload = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))) as {
      name?: string;
      fullName?: string;
      firstName?: string;
      email?: string;
    };
    const fullName = payload.name?.trim() || payload.fullName?.trim() || payload.firstName?.trim();
    if (fullName) return fullName;
    if (payload.email?.includes("@")) return payload.email.split("@")[0] || "Tú";
  } catch {
    return "Tú";
  }
  return "Tú";
}

export default function NewCommunityPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();

  const [name, setName] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyValue>("publica");
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
  const creatorName = useMemo(() => (accessToken ? parseUserNameFromToken(accessToken) : "Tú"), [accessToken]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!inviteWrapperRef.current?.contains(event.target as Node)) {
        setShowInviteDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const filteredSuggestions = useMemo(() => {
    const query = inviteInput.trim().toLowerCase();
    return INVITE_SUGGESTIONS.filter((suggestion) => {
      if (invitedPeople.some((selected) => selected.id === suggestion.id)) return false;
      if (!query) return true;
      return (
        suggestion.name.toLowerCase().includes(query) || suggestion.handle.toLowerCase().includes(query)
      );
    });
  }, [inviteInput, invitedPeople]);

  const communityInitial = useMemo(() => name.trim().charAt(0).toUpperCase() || "C", [name]);

  function appendTag(rawTag: string) {
    const cleanTag = rawTag.trim().replace(/^#/, "");
    if (!cleanTag) return;
    setTags((prev) => {
      if (prev.includes(cleanTag)) return prev;
      return [...prev, cleanTag].slice(0, 10);
    });
  }

  function onTagsKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      appendTag(tagInput);
      setTagInput("");
    }
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);

    if (type === "avatar") {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(localPreview);
      return;
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(localPreview);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    if (!isAuthenticated || !accessToken) {
      setFormError("Inicia sesión para crear una comunidad.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const created = await createCommunity(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          rules: rules.trim() || undefined,
        },
        accessToken,
      );
      router.push(`/app/comunidades/${created.id}`);
      router.refresh();
    } catch (error) {
      setFormError(mapApiError(error, "No se pudo crear la comunidad."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-6">
      <div className="mb-5">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">Crear comunidad</h1>
        <div className="mt-3 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-bold text-indigo-700">
            {getInitials(creatorName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{creatorName}</p>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                Administrador
              </span>
            </div>
            <p className="text-xs text-slate-500">Serás el administrador de esta comunidad.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
        <section className="min-w-0">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="community-name" className="text-sm font-semibold text-slate-900">Nombre de la comunidad *</label>
                <input id="community-name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ej: Cálculo I - Apoyo y ejercicios" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" maxLength={80} required/>
              </div>
              <div className="space-y-2">
                <label htmlFor="community-privacy" className="text-sm font-semibold text-slate-900">Privacidad</label>
                <select id="community-privacy" value={privacy} onChange={(e)=>setPrivacy(e.target.value as PrivacyValue)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <option value="publica">🌐 Pública</option>
                  <option value="privada">🔒 Privada</option>
                </select>
                <p className="text-xs text-slate-500">{privacy === "publica" ? "Cualquiera puede encontrarla y unirse." : "Las personas deberán solicitar acceso."}</p>
              </div>
            </div>

            <div className="space-y-2" ref={inviteWrapperRef}>
              <label htmlFor="invite-people" className="text-sm font-semibold text-slate-900">Invitar personas (opcional)</label>
              <input id="invite-people" value={inviteInput} onChange={(e)=>{setInviteInput(e.target.value);setShowInviteDropdown(true);}} onFocus={()=>setShowInviteDropdown(true)} onKeyDown={(event)=>{if(event.key==="Escape") setShowInviteDropdown(false);}} placeholder="Escribe el nombre de una persona..." className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
              {showInviteDropdown && filteredSuggestions.length > 0 ? (
                <div className="relative">
                  <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {filteredSuggestions.map((person) => (
                      <button key={person.id} type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50" onClick={()=>{setInvitedPeople((prev)=>[...prev, person]);setInviteInput("");setShowInviteDropdown(false);}}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{getInitials(person.name)}</span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{person.name}</span>
                          <span className="block text-xs text-slate-500">{person.handle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {invitedPeople.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {invitedPeople.map((person) => (
                    <span key={person.id} className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold">{getInitials(person.name)}</span>
                      {person.name}
                      <button type="button" aria-label={`Quitar a ${person.name}`} className="text-indigo-600 hover:text-indigo-900" onClick={()=>setInvitedPeople((prev)=>prev.filter((candidate)=>candidate.id!==person.id))}>×</button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="community-description" className="text-sm font-semibold text-slate-900">Descripción (opcional)</label>
              <textarea id="community-description" value={description} onChange={(e)=>setDescription(e.target.value.slice(0,300))} placeholder="Describe de qué trata tu comunidad, su propósito y lo que los miembros pueden encontrar aquí..." rows={4} className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
              <p className="text-right text-xs text-slate-500">{description.length} / 300 caracteres</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="community-tags" className="text-sm font-semibold text-slate-900">Etiquetas (opcional)</label>
              <input id="community-tags" value={tagInput} onChange={(e)=>setTagInput(e.target.value)} onKeyDown={onTagsKeyDown} onBlur={()=>{if(tagInput.trim()){appendTag(tagInput);setTagInput("");}}} placeholder="Agrega etiquetas y presiona Enter..." className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
              {tags.length > 0 ? <div className="flex flex-wrap gap-2">{tags.slice(0,5).map((tag)=><span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{tag}<button type="button" onClick={()=>setTags((prev)=>prev.filter((item)=>item!==tag))}>×</button></span>)}{tags.length>5 ? <span className="text-xs text-slate-500">+{tags.length-5} más</span>:null}</div>:null}
            </div>

            <div className="space-y-2">
              <label htmlFor="community-rules" className="text-sm font-semibold text-slate-900">Reglas de la comunidad (opcional)</label>
              <textarea id="community-rules" value={rules} onChange={(e)=>setRules(e.target.value.slice(0,500))} placeholder="Escribe las reglas y lineamientos que todos los miembros deben seguir..." rows={4} className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"/>
              <p className="text-right text-xs text-slate-500">{rules.length} / 500 caracteres</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="relative block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-indigo-300">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event)=>handleImageChange(event, "avatar")}/>
                <p className="text-2xl">📷</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Sube la imagen de tu comunidad</p>
                <p className="text-xs text-slate-500">JPG, PNG o WebP. Máx. 2MB</p>
                {avatarPreview ? <div className="mt-3 flex items-center justify-center gap-2"><img src={avatarPreview} alt="Preview de comunidad" className="h-14 w-14 rounded-full object-cover"/><button type="button" className="text-xs text-indigo-700" onClick={(event)=>{event.preventDefault();URL.revokeObjectURL(avatarPreview);setAvatarPreview("");}}>Quitar</button></div>:null}
              </label>
              <label className="relative block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-indigo-300">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event)=>handleImageChange(event, "cover")}/>
                <p className="text-2xl">📷</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Sube la imagen de portada</p>
                <p className="text-xs text-slate-500">JPG, PNG o WebP. Máx. 5MB</p>
                {coverPreview ? <div className="mt-3 space-y-2"><img src={coverPreview} alt="Preview de portada" className="h-16 w-full rounded-xl object-cover"/><button type="button" className="text-xs text-indigo-700" onClick={(event)=>{event.preventDefault();URL.revokeObjectURL(coverPreview);setCoverPreview("");}}>Quitar</button></div>:null}
              </label>
            </div>

            {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Link href="/app/comunidades" className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700">Cancelar</Link>
              <button type="submit" disabled={isSubmitting || !name.trim()} className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Creando..." : "Crear comunidad"}</button>
            </div>
          </form>
        </section>

        <aside className="self-start xl:sticky xl:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-base font-bold text-slate-900">👁️ Vista previa</p>
              <p className="text-xs text-slate-500">Así se verá tu comunidad</p>
            </div>
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="h-32 bg-gradient-to-r from-indigo-500 via-blue-400 to-slate-300">{coverPreview ? <img src={coverPreview} alt="Portada de la comunidad" className="h-full w-full object-cover"/>:null}</div>
              <div className="p-4">
                <div className="-mt-10 mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-black text-indigo-700">{avatarPreview ? <img src={avatarPreview} alt="Imagen de comunidad" className="h-full w-full object-cover"/> : communityInitial}</div>
                <h2 className="text-2xl font-black text-slate-950">{name.trim() || "Nombre de la comunidad"}</h2>
                <p className="mt-2 text-sm text-slate-600">{description.trim() || "Comparte el propósito de tu comunidad."}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700"><span>{privacy === "publica" ? "🌐 Pública" : "🔒 Privada"}</span><span>{invitedPeople.length} invitados</span></div>
                {tags.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{tags.slice(0,5).map((tag)=><span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{tag}</span>)}</div> : null}
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">Reglas principales</p>
                  {rules.trim() ? <p className="mt-1 text-xs text-slate-600">{rules.slice(0, 180)}{rules.length > 180 ? "..." : ""}</p> : <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600"><li>Respeta a todos los miembros.</li><li>No se permite spam.</li><li>Comparte materiales permitidos.</li><li>Ayuda y colabora con la comunidad.</li></ul>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500"><div><p className="font-semibold text-slate-700">Miembros</p><p>—</p></div><div><p className="font-semibold text-slate-700">Publicaciones/semana</p><p>—</p></div><div><p className="font-semibold text-slate-700">Creada</p><p>—</p></div></div>
                <p className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs font-medium text-indigo-700">Completa los campos que desees. Solo el nombre es obligatorio.</p>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </main>
  );
}
