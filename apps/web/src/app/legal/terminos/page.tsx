const LAST_UPDATED = "18 de junio de 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Términos y condiciones</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        CrunEdu es una comunidad estudiantil independiente. No representa oficialmente a la
        Universidad Nacional de Educación Enrique Guzmán y Valle ni a ninguna otra institución
        educativa.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">1. Aceptación de los términos</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Al crear una cuenta o utilizar la plataforma CrunEdu, aceptas estos términos en su
        totalidad. Si no estás de acuerdo con alguna parte, debes abstenerte de usar el servicio.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">2. Uso de la plataforma</h2>
      <p className="mt-2 leading-7 text-slate-700">
        CrunEdu está diseñada para fines educativos y de comunidad universitaria. Te comprometes a
        utilizar la plataforma de manera responsable, respetando a los demás estudiantes y
        cumpliendo las normas de comunidad publicadas.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        No está permitido publicar contenido ofensivo, discriminatorio, violento, ilegal o que
        infrinja derechos de terceros. Tampoco está permitido suplantar identidades, enviar spam,
        o realizar actividades que puedan dañar la plataforma o a sus usuarios.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">3. Cuentas y registro</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Notifica
        inmediatamente a CrunEdu si sospechas de un uso no autorizado de tu cuenta. No compartas
        tus credenciales con terceros.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">4. Contenido generado por usuarios</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Al publicar contenido en CrunEdu (publicaciones, comentarios, preguntas, respuestas,
        apuntes, etc.), mantienes tus derechos de propiedad intelectual. Sin embargo, otorgas a
        CrunEdu una licencia no exclusiva, gratuita y mundial para mostrar, distribuir y promover
        dicho contenido dentro de la plataforma.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">5. Limitación de responsabilidad</h2>
      <p className="mt-2 leading-7 text-slate-700">
        CrunEdu se proporciona &quot;tal cual&quot;, sin garantías de disponibilidad continua,
        precisión de la información o idoneidad para un propósito particular. No nos
        responsabilizamos por daños derivados del uso de la plataforma, incluyendo pérdida de
        datos, interrupciones del servicio o acciones de otros usuarios.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        La información sobre trámites, guías y procedimientos universitarios es de carácter
        referencial. Verifica siempre la información oficial en los canales de la universidad.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">6. Modificaciones</h2>
      <p className="mt-2 leading-7 text-slate-700">
        CrunEdu puede modificar estos términos en cualquier momento. Los cambios serán notificados
        a través de la plataforma. El uso continuado del servicio después de los cambios constituye
        la aceptación de los nuevos términos.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">7. Contacto</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Si tienes preguntas sobre estos términos, puedes contactarnos a través de los canales
        disponibles en la plataforma.
      </p>
    </main>
  );
}
