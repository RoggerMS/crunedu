import { redirect } from "next/navigation";

export default function DebatesPage() {
  redirect("/app/conversar?tab=debates");
}
