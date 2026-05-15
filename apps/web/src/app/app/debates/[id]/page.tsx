import { redirect } from "next/navigation";

export default function LegacyDebateDetailRedirectPage() {
  redirect("/app/conversar?tab=debates");
}
