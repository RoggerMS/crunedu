"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Flame, MessageSquare, Loader2 } from "lucide-react";
import { getMomentNewsDetail, buildMomentMediaUrl, type MomentNewsDetailApi, type MomentItemApi } from "@/lib/moments-api";
import { mapApiError } from "@/lib/http-client";
import { MomentMediaFallback } from "@/components/moments/MomentMediaFallback";

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [news, setNews] = useState<MomentNewsDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMomentNewsDetail(params.id)
      .then((data) => { if (!cancelled) setNews(data); })
      .catch((err) => { if (!cancelled) setError(mapApiError(err, "No se pudo cargar la noticia.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-4"><div className="mx-auto flex max-w-3xl items-center justify-center py-20 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando noticia...</div></main>;
  }

  if (error || !news) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border bg-white p-6 text-center">
          <p className="text-slate-700">{error ?? "Esta noticia no está disponible."}</p>
          <Link href="/app/momentos" className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Volver a Momentos</Link>
        </div>
      </main>
    );
  }

  const coverSrc = news.coverImageUrl ? buildMomentMediaUrl(news.coverImageUrl) : null;

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"><ArrowLeft size={16} /> Volver a Noticias</button>

        <article className="overflow-hidden rounded-3xl border bg-white">
          <div className="h-56 w-full overflow-hidden sm:h-72">
            {coverSrc ? <img src={coverSrc} alt={news.title} className="h-full w-full object-cover" /> : <MomentMediaFallback momentType="campus" title={news.title} />}
          </div>
          <div className="space-y-3 p-5">
            <h1 className="text-3xl font-black text-slate-900">{news.title}</h1>
            <p className="text-slate-600">{news.summary}</p>
            <div className="flex flex-wrap gap-2">{news.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs">#{tag}</span>)}</div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" />{news.stats.likes} Me gusta</span>
              <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" />{news.stats.confirmations} confirmaciones</span>
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" />{news.stats.comments} comentarios</span>
            </div>
          </div>
        </article>

        <section>
          <h2 className="mb-2 text-lg font-bold text-slate-900">Momentos relacionados</h2>
          {news.relatedMoments.length === 0 ? (
            <p className="text-sm text-slate-500">No hay momentos relacionados disponibles.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {news.relatedMoments.map((m: MomentItemApi) => {
                const mediaSrc = m.media[0]?.url ? buildMomentMediaUrl(m.media[0].url) : null;
                return (
                  <Link key={m.id} href={`/app/momentos/${m.id}?from=news`} className="flex gap-3 rounded-2xl border bg-white p-3 transition hover:shadow-md">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      {mediaSrc ? <img src={mediaSrc} alt={m.title} className="h-full w-full object-cover" /> : <MomentMediaFallback momentType={m.type as never} title={m.title} compact />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">{m.title}</p>
                      <p className="text-xs text-slate-500">{m.stats.likes} Me gusta · {m.stats.comments} comentarios</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
