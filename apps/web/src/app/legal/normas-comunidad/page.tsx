const LAST_UPDATED = "18 de junio de 2026";

export default function CommunityRulesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Normas de comunidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        CrunEdu es un espacio para que estudiantes universitarios compartan conocimiento,
        resuelvan dudas y construyan comunidad. Para mantener un ambiente útil y respetuoso,
        todas las personas deben seguir estas normas.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">1. Respeta a los demás</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Trata a todos con respeto, incluso cuando no estés de acuerdo. No se tolera el acoso,
        la discriminación, las amenazas ni ningún tipo de violencia. Esto incluye comentarios
        basados en raza, etnia, género, orientación sexual, religión, discapacidad o cualquier
        otra condición personal.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">2. Contenido permitido</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Comparte contenido relacionado con la vida universitaria: dudas académicas, apuntes,
        guías de estudio, experiencias del campus, convocatorias, eventos, trámites y recursos
        educativos. El contenido debe ser veraz y no debe infringir derechos de autor.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">3. Contenido prohibido</h2>
      <p className="mt-2 leading-7 text-slate-700">No está permitido publicar:</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
        <li>Contenido ofensivo, violento, sexualmente explícito o ilegal</li>
        <li>Datos personales de otras personas sin su consentimiento explícito</li>
        <li>Spam, publicidad no autorizada o enlaces engañosos</li>
        <li>Contenido que promueva el plagio o la deshonestidad académica</li>
        <li>Difamación, calumnias o información falsa comprobada</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold text-slate-900">4. Moderación</h2>
      <p className="mt-2 leading-7 text-slate-700">
        CrunEdu se reserva el derecho de moderar, ocultar o eliminar contenido que incumpla
        estas normas. Las sanciones pueden incluir advertencias, suspensión temporal o
        eliminación permanente de la cuenta, según la gravedad y recurrencia de la falta.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">5. Reportes</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Si encuentras contenido que viola estas normas, repórtalo usando la función de
        reporte disponible en cada publicación. Todos los reportes serán revisados por el
        equipo de moderación de CrunEdu.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">6. Actualizaciones</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Estas normas pueden actualizarse periódicamente. Los cambios serán notificados a
        través de la plataforma. El uso continuado de CrunEdu implica la aceptación de las
        normas vigentes.
      </p>
    </main>
  );
}
