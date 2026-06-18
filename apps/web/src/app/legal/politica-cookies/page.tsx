const LAST_UPDATED = "18 de junio de 2026";

export default function CookiesPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Política de cookies</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">1. ¿Qué son las cookies?</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
        navegador para recordar información sobre tu visita, como preferencias de idioma,
        estado de sesión o configuraciones personalizadas.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">2. Cookies que utilizamos</h2>
      <p className="mt-2 leading-7 text-slate-700">En CrunEdu utilizamos los siguientes tipos de cookies:</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
        <li><strong>Técnicas (necesarias):</strong> Para mantener tu sesión activa y permitir el funcionamiento básico de la plataforma.</li>
        <li><strong>De preferencias:</strong> Para recordar tus ajustes de interfaz y preferencias de visualización.</li>
        <li><strong>De análisis:</strong> Para entender cómo se usa la plataforma y mejorar su funcionamiento (datos agregados y anónimos).</li>
      </ul>
      <p className="mt-4 leading-7 text-slate-700">
        No utilizamos cookies de publicidad comportamental ni de terceros para rastreo
        con fines comerciales.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">3. Control de cookies</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Puedes bloquear o eliminar las cookies desde la configuración de tu navegador.
        Ten en cuenta que algunas funciones esenciales de autenticación y navegación
        podrían dejar de funcionar correctamente si deshabilitas las cookies necesarias.
      </p>

      <h2 className="mt-8 text-xl font-bold text-slate-900">4. Cambios en la política</h2>
      <p className="mt-2 leading-7 text-slate-700">
        Actualizaremos esta política cuando sea necesario para reflejar cambios en el uso
        de cookies. Te notificaremos cualquier cambio significativo a través de la plataforma.
      </p>
    </main>
  );
}
