import { CommunityCard } from "./CommunityCard";
import type { CommunityViewModel } from "./types";

export function CommunityGrid({ communities, onJoin }: { communities: CommunityViewModel[]; onJoin: (community: CommunityViewModel) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4 xl:grid-cols-3">{communities.map((community) => <CommunityCard key={community.id} community={community} onJoin={onJoin} />)}</div>;
}
