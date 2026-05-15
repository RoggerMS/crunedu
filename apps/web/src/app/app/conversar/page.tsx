"use client";

import Link from "next/link";
import { ConversarActionBar } from "@/components/conversar/ConversarActionBar";
import { ConversarCompactCard } from "@/components/conversar/ConversarCompactCard";
import { mockConversations } from "@/modules/conversar/mock-data";

export default function ConversarPage() {
  const active = mockConversations.filter((c) => c.status === "live" || c.status === "waiting");

  return (
    <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <ConversarActionBar />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Conversaciones activas</h2>
        <Link href="/app/conversar/en-vivo" className="text-sm font-semibold text-indigo-700">Ver todas</Link>
      </div>
      <div className="space-y-3">{active.map((conversation) => <ConversarCompactCard key={conversation.id} conversation={conversation} />)}</div>
    </section>
  );
}
