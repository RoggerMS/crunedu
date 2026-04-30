import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <Link href="/" className="text-sm text-slate-600 underline-offset-4 hover:underline">
          CrunEdu · Red social educativa universitaria independiente.
        </Link>
      </div>
    </footer>
  );
}
