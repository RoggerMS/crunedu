"use client";

import { AuthProvider } from "@/providers/auth-provider";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
