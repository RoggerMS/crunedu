const LAST_UPDATED = "29 de abril de 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        CrunEdu es una comunidad estudiantil independiente. No representa oficialmente a la Universidad Nacional de Educación Enrique Guzmán y Valle ni a ninguna otra institución educativa.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Al usar esta plataforma aceptas utilizarla de forma responsable, respetar a otros estudiantes y cumplir las normas de comunidad publicadas por CrunEdu.
      </p>
    </main>
  );
}
