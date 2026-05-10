import { EmptyState, PrimaryButton } from "@/components/ui";

export function DebatesEmptyState({ message, onCreate }: { message: string; onCreate: () => void }) {
  return <EmptyState title="No hay debates para este filtro" description={message} action={<PrimaryButton onClick={onCreate}>Crear debate</PrimaryButton>} />;
}
