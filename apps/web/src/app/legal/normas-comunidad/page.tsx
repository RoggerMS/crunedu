const LAST_UPDATED = "29 de abril de 2026";

export default function CommunityRulesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Normas de comunidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        Participa con respeto. No se permite contenido ofensivo, discriminatorio, violento o que exponga datos personales de otras personas sin permiso.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        CrunEdu puede moderar o retirar publicaciones que incumplan estas reglas para proteger un entorno útil y seguro para estudiantes.
      </p>
    </main>
  );
}
