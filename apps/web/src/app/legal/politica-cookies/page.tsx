const LAST_UPDATED = "29 de abril de 2026";

export default function CookiesPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-black text-slate-950">Política de cookies</h1>
      <p className="mt-2 text-sm text-slate-500">Última actualización: {LAST_UPDATED}</p>

      <p className="mt-6 leading-7 text-slate-700">
        Usamos cookies y tecnologías similares para mantener sesiones activas, mejorar la experiencia de uso y analizar el funcionamiento básico de la plataforma.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        Puedes borrar o bloquear cookies desde tu navegador, aunque algunas funciones de autenticación podrían dejar de funcionar correctamente.
      </p>
    </main>
  );
}
