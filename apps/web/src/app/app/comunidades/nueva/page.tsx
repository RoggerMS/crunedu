"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, PrimaryButton, TextArea } from "@/components/ui";
import { useAccessToken } from "@/hooks/useAccessToken";
import { createCommunity } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/http-client";

type CommunityFormState = {
  name: string;
  description: string;
  rules: string;
  avatarUrl: string;
  coverUrl: string;
  avatarPreview: string;
  coverPreview: string;
};
const initialForm: CommunityFormState = {
  name: "",
  description: "",
  rules: "",
  avatarUrl: "",
  coverUrl: "",
  avatarPreview: "",
  coverPreview: "",
};

export default function NewCommunityPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAccessToken();
  const [form, setForm] = useState<CommunityFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initial = useMemo(
    () => form.name.trim().charAt(0).toUpperCase() || "C",
    [form.name],
  );
  function handleFilePreview(field: "avatarPreview" | "coverPreview") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const localPreview = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, [field]: localPreview }));
    };
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated || !accessToken) {
      setFormError("Inicia sesión para crear una comunidad.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createCommunity(
        {
          name: form.name,
          description: form.description || undefined,
          rules: form.rules || undefined,
          avatarUrl: form.avatarUrl || undefined,
          coverUrl: form.coverUrl || undefined,
        },
        accessToken,
      );
      router.push("/app/comunidades");
      router.refresh();
    } catch (error) {
      setFormError(mapApiError(error, "No se pudo crear la comunidad."));
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-black tracking-tight">Nueva comunidad</h1>
        <p className="mt-2 text-slate-600">
          Completa los datos y revisa una vista previa antes de publicar.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
          onSubmit={handleSubmit}
        >
          <Input
            placeholder="Nombre de la comunidad"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
            minLength={3}
            maxLength={80}
          />
          <TextArea
            placeholder="Descripción"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            maxLength={300}
            rows={3}
          />
          <TextArea
            placeholder="Reglas de la comunidad"
            value={form.rules}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, rules: event.target.value }))
            }
            maxLength={500}
            rows={4}
          />
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Imagen de la comunidad
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFilePreview("avatarPreview")}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Imagen de portada
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFilePreview("coverPreview")}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            Por ahora, las imágenes se guardan por URL en el backend. Si deseas
            persistir imagen y portada, pega su URL aquí.
          </p>
          <Input
            type="url"
            placeholder="URL de imagen de la comunidad (opcional)"
            value={form.avatarUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
            }
          />
          <Input
            type="url"
            placeholder="URL de portada (opcional)"
            value={form.coverUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, coverUrl: event.target.value }))
            }
          />
          {formError ? (
            <p className="whitespace-pre-wrap text-sm text-red-700">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Publicando..." : "Publicar comunidad"}
            </PrimaryButton>
            <Link
              href="/app/comunidades"
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </Link>
          </div>
        </form>
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Vista previa</h2>
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="h-28 bg-slate-200">
              {form.coverPreview || form.coverUrl ? (
                <img
                  src={form.coverPreview || form.coverUrl}
                  alt="Vista previa de portada"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="p-4">
              <div className="-mt-10 mb-3 h-14 w-14 overflow-hidden rounded-2xl border-4 border-white bg-indigo-50">
                {form.avatarPreview || form.avatarUrl ? (
                  <img
                    src={form.avatarPreview || form.avatarUrl}
                    alt="Vista previa de comunidad"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl font-black text-indigo-700">
                    {initial}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                {form.name.trim() || "Nombre de la comunidad"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {form.description.trim() ||
                  "Aquí verás la descripción de tu comunidad."}
              </p>
              <p className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-700">
                {form.rules.trim() ||
                  "Aquí aparecerán las reglas principales para tus miembros."}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
