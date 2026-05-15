import { redirect } from "next/navigation";

export default function LegacyCreateDebateRedirectPage() {
  redirect("/app/conversar/nueva");
}
