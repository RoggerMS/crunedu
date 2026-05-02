"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell, MessageCircle, UsersRound } from "lucide-react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { usePosts } from "@/hooks/usePosts";
import { Card, EmptyState, PrimaryButton, SecondaryButton } from "@/components/ui";

function parseJwtPayload(token: string): { sub?: number } | null {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return null;
    return JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: number };
  } catch {
    return null;
  }
}

export default function ReutilizablePage() {
  const { posts } = usePosts();
  const { accessToken, isAuthenticated } = useAccessToken();

  const userId = useMemo(() => (accessToken ? parseJwtPayload(accessToken)?.sub ?? null : null), [accessToken]);
  const affinityPosts = useMemo(() => posts.filter((post) => (userId ? post.author.id !== userId : true)).slice(0, 3), [posts, userId]);
  const hasReplies = posts.some((post) => post.commentsCount > 0);

  return (
    <section className="space-y-4">
      <Card className="space-y-2">
        <h1 className="text-2xl font-black">Reutilizable</h1>
        <p className="text-sm text-slate-600">Aquí agrupamos bloques reutilizables para futuras iteraciones del producto.</p>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="space-y-3">
          <h2 className="text-base font-bold">Nuevas publicaciones en comunidades</h2>
          {affinityPosts.length > 0 ? (
            <>
              <p className="text-sm text-slate-700">{affinityPosts[0].title || affinityPosts[0].content.slice(0, 90)}</p>
              <SecondaryButton asChild><Link href="/app/comunidades">Explorar comunidades</Link></SecondaryButton>
            </>
          ) : (
            <EmptyState title="Sin novedades" description="Aún no hay publicaciones nuevas en comunidades." />
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold">Preguntas y respuestas</h2>
          {hasReplies ? (
            <>
              <p className="text-sm text-slate-600">Hay publicaciones con respuestas nuevas para revisar.</p>
              <PrimaryButton asChild><Link href="/app/preguntas"><MessageCircle size={16} />Ver preguntas</Link></PrimaryButton>
            </>
          ) : (
            <EmptyState title="Sin respuestas nuevas" description="Puedes crear una pregunta para iniciar un debate académico." action={<SecondaryButton asChild><Link href="/app/preguntas">Publicar pregunta</Link></SecondaryButton>} />
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold">Actividad de tus amigos</h2>
          {isAuthenticated ? (
            <>
              <p className="text-sm text-slate-600">Recibirás alertas sobre actividad de tus amigos y contenido relevante.</p>
              <SecondaryButton asChild><Link href="/app/perfil"><UsersRound size={16} />Interactuar con tus amigos</Link></SecondaryButton>
            </>
          ) : (
            <EmptyState title="Inicia sesión" description="Necesitas sesión para ver actividad de amigos y notificaciones personalizadas." action={<PrimaryButton asChild><Link href="/login">Ir a login</Link></PrimaryButton>} />
          )}
        </Card>
      </div>

      <Card className="space-y-2">
        <h2 className="text-base font-bold">Notificaciones (base)</h2>
        <p className="text-sm text-slate-600">Esta sección consolida alertas de publicaciones relevantes, preguntas destacadas y actividad de amigos.</p>
        <SecondaryButton asChild><Link href="/app/notificaciones"><Bell size={16} />Abrir notificaciones</Link></SecondaryButton>
      </Card>
    </section>
  );
}
