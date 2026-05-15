"use client";
import Link from "next/link";
import { Atom, BookOpen, Code2, FlaskConical, Globe2, GraduationCap, Landmark, Lightbulb, MessagesSquare, Scale, Sigma, Users, Brain, Cpu } from "lucide-react";
import { ConversarActionBar } from "@/components/conversar/ConversarActionBar";
const topics=[
["Matemática",Sigma],["Historia",Landmark],["Filosofía",Lightbulb],["Física",Atom],["Química",FlaskConical],["Comunicación",MessagesSquare],["Programación",Code2],["Inglés",Globe2],["Psicología",Brain],["Educación",BookOpen],["Ingeniería",Cpu],["Ciencia política",Scale],["Vida universitaria",Users],["Tecnología",GraduationCap]
] as const;
export default function Page(){return <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8"><ConversarActionBar/><div><h2 className="text-lg font-bold text-slate-900">Cursos o temas</h2><p className="text-sm text-slate-600">Elige un curso o tema para encontrar conversaciones relacionadas.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{topics.map(([name,Icon],i)=><Link key={name} href={`/app/conversar/temas?tema=${encodeURIComponent(name)}`} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:bg-indigo-50/30"><div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${i%2?"bg-indigo-100 text-indigo-700":"bg-emerald-100 text-emerald-700"}`}><Icon size={22}/></div><p className="font-semibold text-slate-900">{name}</p><p className="text-xs text-slate-500">{(i%8)+3} conversaciones · {(i%3)+1} en vivo</p></Link>)}</div></section>}
