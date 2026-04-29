const LAST_UPDATED = "29 de abril de 2026";

export default function AdvertisingPreferencesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Preferencias de anuncios y publicidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        En el MVP de CrunEdu no se utiliza publicidad personalizada. Si esto cambia, podrás administrar aquí tus preferencias de anuncios.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Publicaremos cualquier actualización sobre segmentación o patrocinio antes de activar nuevas funciones de publicidad.
      </p>
    </main>
  );
}
