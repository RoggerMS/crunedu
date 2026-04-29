import Link from "next/link";

const legalLinks = [
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/politica-privacidad", label: "Política de privacidad" },
  { href: "/legal/politica-cookies", label: "Política de cookies" },
  { href: "/legal/preferencias-publicidad", label: "Preferencias de anuncios" },
  { href: "/legal/normas-comunidad", label: "Normas de comunidad" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        <p className="text-sm text-slate-600">CrunEdu · Red social educativa universitaria independiente.</p>

        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-slate-700 underline-offset-4 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
