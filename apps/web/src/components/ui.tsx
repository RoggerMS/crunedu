import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft ${className}`}>{children}</div>;
}

export function PrimaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 ${className}`}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return <button {...props} className={`rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 ${className}`}>{children}</button>;
}

export function FormField({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-indigo-200 transition focus:ring ${className}`} />;
}

export function TextArea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-indigo-200 transition focus:ring ${className}`} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-indigo-200 transition focus:ring ${className}`} />;
}

export function StatusMessage({ type, children }: { type: "error" | "success" | "loading" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    loading: "border-slate-200 bg-slate-50 text-slate-600",
    info: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };

  return <p className={`rounded-2xl border px-3 py-2 text-sm ${styles[type]}`}>{children}</p>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function PageState({
  type,
  title,
  description,
  action,
}: {
  type: "loading" | "empty" | "error" | "success";
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const styles = {
    loading: "border-slate-200 bg-slate-50",
    empty: "border-slate-200 bg-white",
    error: "border-red-200 bg-red-50",
    success: "border-emerald-200 bg-emerald-50",
  };

  return (
    <Card className={styles[type]}>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
