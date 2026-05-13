"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, MoreHorizontal, Users, FileText } from "lucide-react";

type Privacy = "publica" | "privada";
type CommunityStatus = "nueva" | "muy_activa" | "normal";
type ExploreFilter = "todas" | "mis" | "nuevas" | "activas" | "privadas" | "publicas";
type SortOption = "recientes" | "activas" | "az";
type TopView = "explorar" | "mis" | "publicaciones";

type Community = {
  id: string;
  name: string;
  description: string;
  cover: string;
  icon: string;
  tags: string[];
  membersCount: number;
  weeklyPosts: number;
  isMember: boolean;
  privacy: Privacy;
  status: CommunityStatus;
  createdAt: string;
  sampleMembers: string[];
};

const BASE_COMMUNITIES: Community[] = [
  ["calculo-apoyo", "Cálculo I - Grupo de apoyo", "Resolución de ejercicios y sesiones de refuerzo.", ["Cálculo", "Apoyo académico", "UNE"], "publica", "muy_activa", 128, 36, true, ["AM", "JS", "LV"]],
  ["becas-tramites", "Becas y Trámites UNE", "Orientación para becas, constancias y procesos.", ["Becas", "Trámites", "UNE"], "publica", "normal", 212, 21, false, ["CR", "MF", "DT"]],
  ["fisica-2026", "Física General 2026", "Guías, laboratorios y prácticas colaborativas.", ["Física", "Laboratorio", "Apoyo académico"], "publica", "muy_activa", 164, 41, true, ["PA", "TG", "RN"]],
  ["emprendedores-u", "Emprendedores U", "Ideas, validación y networking entre estudiantes.", ["Emprendimiento", "Investigación", "UNE"], "publica", "nueva", 64, 12, false, ["KL", "AD", "PX"]],
  ["ing-software-2026", "Ingeniería de Software 2026", "Apuntes y talleres de arquitectura y código.", ["Programación", "Investigación", "UNE"], "privada", "normal", 143, 25, false, ["IO", "QE", "NM"]],
  ["mate-discreta", "Matemática Discreta", "Teoría de grafos, lógica y ejercicios semanales.", ["Cálculo", "Programación", "Apoyo académico"], "publica", "normal", 98, 17, false, ["ER", "YU", "PL"]],
  ["practicas-pre", "Prácticas Preprofesionales", "Consejos para CV, entrevistas y convocatorias.", ["UNE", "Trámites", "Emprendimiento"], "publica", "nueva", 56, 9, true, ["GI", "WA", "XO"]],
  ["lab-quimica", "Laboratorio de Química", "Protocolos, reportes y preparación de prácticas.", ["Laboratorio", "Investigación", "UNE"], "privada", "muy_activa", 87, 30, false, ["HS", "VC", "MB"]],
  ["club-ingles", "Club de Inglés", "Speaking clubs y material para certificaciones.", ["Inglés", "Apoyo académico", "UNE"], "publica", "normal", 120, 15, false, ["FD", "UJ", "NK"]],
  ["invest-educativa", "Investigación Educativa", "Semilleros, referencias y metodología.", ["Investigación", "Tesis", "UNE"], "privada", "normal", 73, 11, false, ["ZT", "AA", "LM"]],
  ["ayuda-tesis", "Ayuda con Tesis", "Asesoría entre pares para avances y estructura.", ["Tesis", "Investigación", "Apoyo académico"], "publica", "muy_activa", 190, 33, true, ["GH", "TR", "EP"]],
  ["diseno-emprendimiento", "Diseño y Emprendimiento", "Marca personal, prototipos y presentación.", ["Emprendimiento", "Investigación", "Inglés"], "publica", "nueva", 52, 8, false, ["BV", "CA", "SD"]],
  ["programacion-csharp", "Programación en C#", "Retos semanales y revisión de proyectos.", ["Programación", "Apoyo académico", "UNE"], "publica", "normal", 134, 24, false, ["RF", "OP", "TY"]],
  ["algebra-lineal", "Álgebra Lineal", "Matrices, espacios vectoriales y preparación de parciales.", ["Cálculo", "Apoyo académico", "Investigación"], "publica", "normal", 110, 18, false, ["ZX", "QW", "HJ"]],
  ["materiales-estudio", "Materiales de Estudio", "Banco colaborativo de recursos permitidos.", ["Apoyo académico", "Trámites", "Programación"], "privada", "nueva", 46, 7, false, ["PO", "LK", "MN"]],
].map((item, index) => ({
  id: item[0],
  name: item[1],
  description: item[2],
  tags: item[3] as string[],
  privacy: item[4] as Privacy,
  status: item[5] as CommunityStatus,
  membersCount: item[6] as number,
  weeklyPosts: item[7] as number,
  isMember: item[8] as boolean,
  sampleMembers: item[9] as string[],
  icon: item[1].slice(0, 1),
  cover: index % 2 === 0 ? "from-indigo-200 via-violet-100 to-white" : "from-sky-200 via-indigo-100 to-white",
  createdAt: new Date(Date.now() - (index + 1) * 86_400_000 * 3).toISOString(),
}));

export default function CommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>(BASE_COMMUNITIES);
  const [topView, setTopView] = useState<TopView>("explorar");
  const [filter, setFilter] = useState<ExploreFilter>("todas");
  const [sort, setSort] = useState<SortOption>("recientes");
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", privacy: "publica" as Privacy, tags: "" });
  const [requests, setRequests] = useState<Record<string, boolean>>({});

  const recommended = useMemo(() => [...communities].sort((a, b) => scoreCommunity(b) - scoreCommunity(a)), [communities]);

  const filtered = useMemo(() => {
    let list = [...communities];
    if (topView === "mis" || filter === "mis") list = list.filter((community) => community.isMember);
    if (filter === "nuevas") list = list.filter((community) => community.status === "nueva");
    if (filter === "activas") list = list.filter((community) => community.status === "muy_activa");
    if (filter === "privadas") list = list.filter((community) => community.privacy === "privada");
    if (filter === "publicas") list = list.filter((community) => community.privacy === "publica");

    if (sort === "recientes") list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "activas") list.sort((a, b) => activityRatio(b) - activityRatio(a));
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [communities, filter, sort, topView]);

  const showTemporaryToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const onJoin = (community: Community) => {
    if (community.privacy === "privada") {
      setRequests((prev) => ({ ...prev, [community.id]: true }));
      showTemporaryToast("Solicitud enviada.");
      return;
    }
    setCommunities((prev) => prev.map((item) => (item.id === community.id ? { ...item, isMember: true, membersCount: item.membersCount + 1 } : item)));
  };

  const onCreate = () => {
    if (!draft.name.trim() || !draft.description.trim()) return showTemporaryToast("Completa nombre y descripción.");
    const tags = draft.tags.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6);
    const newCommunity: Community = {
      id: `custom-${Date.now()}`,
      name: draft.name.trim(),
      description: draft.description.trim(),
      cover: "from-violet-200 via-indigo-100 to-white",
      icon: draft.name.trim().slice(0, 1).toUpperCase(),
      tags,
      membersCount: 1,
      weeklyPosts: 0,
      isMember: true,
      privacy: draft.privacy,
      status: "nueva",
      createdAt: new Date().toISOString(),
      sampleMembers: ["TU"],
    };
    setCommunities((prev) => [newCommunity, ...prev]);
    setShowCreate(false);
    setDraft({ name: "", description: "", privacy: "publica", tags: "" });
  };

  return (
    <section className="mx-auto max-w-[1440px] space-y-4 px-4 pb-6 lg:px-6">
      {toast ? <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{toast}</div> : null}

      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-slate-700">Explora espacios por curso, carrera, trámite o interés académico.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowCreate(true)}>Crear comunidad</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => { setTopView("mis"); setFilter("mis"); }}>Mis comunidades</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setTopView("publicaciones")}>Publicaciones</button>
          </div>
        </div>
      </div>

      {topView === "publicaciones" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Publicaciones de tus comunidades</h2>
          <p className="mt-2 text-sm text-slate-600">Aún no hay publicaciones de tus comunidades.</p>
          <p className="text-sm text-slate-500">Únete a comunidades o participa para ver contenido aquí.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recomendadas para ti</h2>
                <p className="text-xs text-slate-500">Según tus intereses, cursos y comunidades visitadas.</p>
              </div>
              <button className="text-sm font-semibold text-indigo-600" onClick={() => setShowAllRecommended((prev) => !prev)}>{showAllRecommended ? "Volver a explorar" : "Ver más"}</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {(showAllRecommended ? recommended : recommended.slice(0, 4)).map((community) => (
                <div key={`recommended-${community.id}`} className="min-w-[260px] flex-1">
                  <CommunityCard community={community} requestSent={Boolean(requests[community.id])} onJoin={onJoin} onEnter={() => router.push(`/app/comunidades/${community.id}`)} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-base font-semibold text-slate-900">{topView === "mis" || filter === "mis" ? "Mis comunidades" : showAllRecommended ? "Comunidades recomendadas para ti" : "Explorar comunidades"}</h2>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    ["todas", "Todas"], ["mis", "Mis comunidades"], ["nuevas", "Nuevas"], ["activas", "Activas"], ["privadas", "Privadas"], ["publicas", "Públicas"],
                  ].map(([value, label]) => <button key={value} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => { setFilter(value as ExploreFilter); if (value !== "mis") setTopView("explorar"); }}>{label}</button>)}
                </div>
                <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  <option value="recientes">Más recientes</option>
                  <option value="activas">Más activas</option>
                  <option value="az">Nombre A-Z</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {(showAllRecommended ? recommended : filtered).map((community) => (
                <CommunityCard key={community.id} community={community} requestSent={Boolean(requests[community.id])} onJoin={onJoin} onEnter={() => router.push(`/app/comunidades/${community.id}`)} />
              ))}
            </div>
          </div>
        </>
      )}

      {showCreate ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Crear comunidad</h3>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Nombre" value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
              <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Descripción" value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
              <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={draft.privacy} onChange={(event) => setDraft((prev) => ({ ...prev, privacy: event.target.value as Privacy }))}>
                <option value="publica">Pública</option>
                <option value="privada">Privada</option>
              </select>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Etiquetas separadas por coma" value={draft.tags} onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" onClick={onCreate}>Crear</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CommunityCard({ community, requestSent, onJoin, onEnter }: { community: Community; requestSent: boolean; onJoin: (community: Community) => void; onEnter: () => void; }) {
  const visibleTags = community.tags.slice(0, 3);
  const hiddenTags = Math.max(community.tags.length - visibleTags.length, 0);
  const action = community.isMember ? "Entrar" : community.privacy === "privada" ? (requestSent ? "Solicitud enviada" : "Solicitar acceso") : "Unirse";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-16 bg-gradient-to-r ${community.cover}`} />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">{community.icon}</div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{community.name}</h3>
              <p className="line-clamp-2 text-xs text-slate-600">{community.description}</p>
            </div>
          </div>
          <button className="rounded-lg p-1 text-slate-500"><MoreHorizontal size={16} /></button>
        </div>

        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => <span key={`${community.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">{tag}</span>)}
          {hiddenTags > 0 ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700">+{hiddenTags}</span> : null}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Users size={12} /> {community.membersCount}</span>
          <span className="inline-flex items-center gap-1"><FileText size={12} /> {community.weeklyPosts} esta semana</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {community.sampleMembers.slice(0, 3).map((member) => <span key={`${community.id}-${member}`} className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-700">{member}</span>)}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {community.status === "nueva" ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Nueva</span> : null}
            {community.status === "muy_activa" ? <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">Muy activa</span> : null}
            {community.privacy === "privada" ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700"><Lock size={10} /> Privada</span> : null}
          </div>
        </div>

        <button className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70" disabled={action === "Solicitud enviada"} onClick={() => (action === "Entrar" ? onEnter() : onJoin(community))}>{action}</button>
      </div>
    </article>
  );
}

function activityRatio(community: Community) {
  return community.weeklyPosts / Math.max(community.membersCount / 40, 1);
}

function scoreCommunity(community: Community) {
  const interestTags = ["Apoyo académico", "Programación", "Investigación", "Trámites", "Tesis"];
  const tagMatch = community.tags.filter((tag) => interestTags.includes(tag)).length / 3;
  const activity = Math.min(activityRatio(community) / 15, 1);
  const freshness = Math.max(0, 1 - (Date.now() - new Date(community.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 120));
  const diversity = community.privacy === "privada" ? 0.7 : 1;
  return tagMatch * 0.35 + activity * 0.25 + freshness * 0.2 + diversity * 0.2;
}
