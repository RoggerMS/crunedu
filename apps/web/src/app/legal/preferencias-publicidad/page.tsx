const LAST_UPDATED = "18 de junio de 2026";

export default function AdvertisingPreferencesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Preferencias de anuncios y publicidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Estado actual (MVP)</h2>
      <p className="mt-2 leading-7 text-slate-700">
        En la versión actual (MVP) de CrunEdu no se utiliza publicidad personalizada ni
        de terceros. La plataforma se mantiene como un espacio libre de anuncios para
        la comunidad estudiantil.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Planes futuros</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Si en el futuro CrunEdu implementara publicidad o contenido patrocinado, se
        informará con anticipación a los usuarios y esta página permitirá administrar
        tus preferencias de anuncios. La publicidad, de existir, será claramente
        identificada y relevante para la comunidad universitaria.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Transparencia</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Publicaremos cualquier actualización sobre segmentación, patrocinio o nuevos
        modelos de monetización antes de activarlos. CrunEdu prioriza la transparencia
        y el consentimiento informado de sus usuarios.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">Contacto</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Si tienes preguntas sobre publicidad en CrunEdu, puedes contactarnos a través
        de los canales disponibles en la plataforma.
      </p>
    </main>
  );
}
