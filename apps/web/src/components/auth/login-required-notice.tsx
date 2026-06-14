import Link from "next/link";
import { buildLoginHref } from "@/lib/auth-routes";

type LoginRequiredNoticeProps = {
  title: string;
  description: string;
  returnUrl: string;
  label?: string;
  className?: string;
};

export function LoginRequiredNotice({
  title,
  description,
  returnUrl,
  label = "Iniciar sesión",
  className = "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900",
}: LoginRequiredNoticeProps) {
  return (
    <div className={className}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
      <Link
        href={buildLoginHref(returnUrl)}
        className="mt-3 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {label}
      </Link>
    </div>
  );
}
