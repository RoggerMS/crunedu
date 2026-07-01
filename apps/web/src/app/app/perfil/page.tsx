"use client";

import { Suspense } from "react";
import { LoginRequiredNotice } from "@/components/auth/login-required-notice";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { useAuth } from "@/hooks/useAuth";

function MiPerfilContent() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">Cargando perfil...</p>;
  if (!user) return <LoginRequiredNotice title="Inicia sesión para ver tu perfil." description="Puedes volver a esta pantalla después de autenticarte." returnUrl="/app/perfil" />;
  return <PublicProfile userId={user.id} />;
}

export default function MiPerfilPage() {
  return (
    <Suspense fallback={<p className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">Cargando perfil...</p>}>
      <MiPerfilContent />
    </Suspense>
  );
}
