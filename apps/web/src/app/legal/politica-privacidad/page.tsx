const LAST_UPDATED = "18 de junio de 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Política de privacidad</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">1. Información que recopilamos</h2>
      <p className="mt-2 leading-7 text-slate-700">
        CrunEdu recopila los siguientes datos personales cuando creas una cuenta:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
        <li>Nombre y apellidos</li>
        <li>Correo electrónico institucional o personal</li>
        <li>Contraseña (almacenada de forma segura con hash)</li>
        <li>Información académica opcional: facultad, carrera y ciclo</li>
      </ul>
      <p className="mt-4 leading-7 text-slate-700">
        También recopilamos datos de uso como publicaciones, comentarios, preguntas,
        respuestas, interacciones con contenido y métricas de navegación básicas.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">2. Uso de la información</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Tus datos se utilizan para:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
        <li>Permitir la autenticación y el funcionamiento de tu cuenta</li>
        <li>Mostrar tu perfil público con información académica opcional</li>
        <li>Publicar y gestionar contenido dentro de la plataforma</li>
        <li>Mejorar la experiencia de usuario y detectar problemas técnicos</li>
        <li>Prevenir abusos y moderar contenido</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold text-slate-900">3. Información pública</h2>
      <p className="mt-2 leading-7 text-slate-700">
        En tu perfil público mostramos únicamente la información académica que hayas
        proporcionado (facultad, carrera y ciclo), tu nombre y tu actividad en la
        plataforma (publicaciones, preguntas, respuestas). El correo electrónico no se
        expone en la interfaz pública del perfil.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">4. Compartición con terceros</h2>
      <p className="mt-2 leading-7 text-slate-700">
        No vendemos datos personales a terceros. Podemos compartir información agregada y
        anonimizada para fines estadísticos. En caso de requerimiento legal, podemos
        divulgar información personal conforme a la ley aplicable.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">5. Seguridad de los datos</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Implementamos medidas técnicas y organizativas para proteger tus datos personales
        contra acceso no autorizado, pérdida o destrucción. Sin embargo, ningún sistema es
        completamente seguro y no podemos garantizar la seguridad absoluta de la información.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">6. Tus derechos</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Puedes solicitar la corrección o eliminación de tus datos personales contactándonos
        a través de la plataforma. También puedes cerrar tu cuenta en cualquier momento desde
        la configuración de perfil.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">7. Cambios en esta política</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Cualquier cambio en esta política será informado a través de la plataforma. Te
        recomendamos revisar periódicamente esta página para mantenerte informado.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">8. Contacto</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través
        de los canales disponibles en la plataforma.
      </p>
    </main>
  );
}
