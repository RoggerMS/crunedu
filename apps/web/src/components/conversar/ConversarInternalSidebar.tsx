"use client";

import { BookOpen, GraduationCap, Home, PlayCircle, Radio, Scale, Users, Clock3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app/conversar", label: "Conversar", icon: Home },
  { href: "/app/conversar/temas", label: "Cursos o temas", icon: BookOpen },
  { href: "/app/conversar/en-vivo", label: "En vivo", icon: Radio },
  { href: "/app/conversar/en-espera", label: "En espera", icon: Clock3 },
  { href: "/app/conversar/debates", label: "Debates", icon: Scale },
  { href: "/app/conversar/grabaciones", label: "Grabaciones", icon: PlayCircle },
  { href: "/app/conversar/companeros", label: "Compañeros", icon: Users },
];

export function ConversarInternalSidebar() {
  const pathname = usePathname();

  return <div className="flex h-full flex-col"><Link href="/app" className="flex items-center gap-3 text-2xl font-black tracking-tight"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white"><GraduationCap size={22} /></span>Crun<span className="-ml-3 text-indigo-600">Edu</span></Link><Link href="/app" className="mt-4 text-xs font-semibold text-slate-500 hover:text-indigo-700">← Volver a CrunEdu</Link><p className="mt-6 text-sm font-bold text-slate-900">Conversar</p><nav className="mt-3 space-y-1">{items.map((item)=>{const active=pathname===item.href||pathname.startsWith(`${item.href}/`); const Icon=item.icon; return <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${active?"bg-indigo-50 text-indigo-700":"text-slate-700 hover:bg-slate-100"}`}><Icon size={16}/>{item.label}</Link>})}</nav></div>;
}
