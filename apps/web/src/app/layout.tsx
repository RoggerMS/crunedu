import type { Metadata } from "next";
import { PublicFooter } from "@/components/public-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrunEdu",
  description: "Apuntes, dudas y comunidad universitaria en un solo lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col bg-white text-slate-900">
        <div className="flex-1">{children}</div>
        <PublicFooter />
      </body>
    </html>
  );
}
