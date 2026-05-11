import { redirect } from "next/navigation";

export default async function TramiteDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/universidad/${id}`);
}
