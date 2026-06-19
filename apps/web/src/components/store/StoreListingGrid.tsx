import { StoreListingCard } from "./StoreListingCard";
import type { StoreProduct } from "@/lib/api-helpers";

export function StoreListingGrid({
  items,
  onSave,
  onShare,
  onReport,
  onHide,
  viewerRole,
}: {
  items: StoreProduct[];
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  onHide: (id: string) => void;
  viewerRole?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <StoreListingCard
          key={item.id}
          item={item}
          onSave={onSave}
          onShare={onShare}
          onReport={onReport}
          onHide={onHide}
          viewerRole={viewerRole}
        />
      ))}
    </div>
  );
}
