import { StoreListingCard } from "./StoreListingCard";
import type { StoreListing } from "./types";

export function StoreListingGrid({ items, ...handlers }: { items: StoreListing[]; onSave: (id: string) => void; onContact: (t: string) => void; onShare: (id: string) => void; onReport: () => void; onHide: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <StoreListingCard key={item.id} item={item} {...handlers} />
      ))}
    </div>
  );
}
