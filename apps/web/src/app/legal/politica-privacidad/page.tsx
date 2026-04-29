const LAST_UPDATED = "29 de abril de 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Política de privacidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        CrunEdu recopila datos básicos de cuenta para permitir autenticación, publicación de contenido y funcionamiento general de la comunidad.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        No vendemos datos personales a terceros. Cualquier uso adicional de datos deberá comunicarse de forma clara en esta política.
      </p>
    </main>
  );
}
