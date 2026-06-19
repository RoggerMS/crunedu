"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { useCommunities } from "@/hooks/useCommunities";

export default function NewNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCommunityId = searchParams.get("communityId") ? Number(searchParams.get("communityId")) : undefined;
  const { communities } = useCommunities();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const handle = window.setTimeout(() => setToast(null), 3000);
      return () => window.clearTimeout(handle);
    }
  }, [toast]);

  return (
    <section className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      {toast ? <div className={`fixed bottom-4 right-4 z-50 rounded-xl px-4 py-2 text-sm font-semibold text-white ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-700" : "bg-indigo-600"}`}>{toast.message}</div> : null}
      <CreateNoteModal
        open
        onClose={() => router.push("/app/apuntes")}
        onPublished={() => router.push("/app/apuntes")}
        onToast={(message, type) => setToast({ message, type })}
        communities={communities}
        initialCommunityId={initialCommunityId}
      />
      <p className="text-center text-sm text-slate-500">Sube un apunte real con archivo. El curso es opcional dentro de «Más opciones».</p>
    </section>
  );
}
