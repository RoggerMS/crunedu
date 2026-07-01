import { Suspense } from "react";
import { PublicProfile } from "@/components/profile/PublicProfile";

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const userId = Number(params.id);
  if (!Number.isInteger(userId) || userId <= 0) return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">Perfil no válido.</p>;
  return (
    <Suspense fallback={<p className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">Cargando perfil...</p>}>
      <PublicProfile userId={userId} />
    </Suspense>
  );
}
