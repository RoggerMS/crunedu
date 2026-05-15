"use client";
import { ConversarActionBar } from "@/components/conversar/ConversarActionBar";
import { ConversarCompactCard } from "@/components/conversar/ConversarCompactCard";
import { mockConversations } from "@/modules/conversar/mock-data";
export default function Page(){const items=mockConversations.filter((c)=>c.status==="live"); return <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8"><ConversarActionBar/><h2 className="text-lg font-bold text-slate-900">En vivo</h2><div className="space-y-3">{items.map((c)=><ConversarCompactCard key={c.id} conversation={c}/>)}</div></section>}
