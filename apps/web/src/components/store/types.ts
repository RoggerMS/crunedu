export type StoreListingType = "sale" | "exchange" | "donation" | "service" | "rental" | "request";
export type StorePriceType = "fixed" | "negotiable" | "free" | "contact" | "exchange" | "hourly" | "from";
export type StoreDeliveryType = "campus" | "safe_point" | "pickup" | "coordinated" | "shipping" | "digital";
export type StoreListingStatus = "active" | "draft" | "hidden" | "sold_out" | "deleted" | "available" | "reserved" | "sold" | "paused";
export type StoreSort = "relevance" | "recent" | "low_price" | "high_price" | "most_viewed" | "most_saved" | "verified" | "campus";

export interface StoreListingImage {
  id: number;
  imageUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  position: number;
  isCover: boolean;
  altText?: string | null;
}

export interface StoreListingCategory {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
  description?: string | null;
}

export interface StoreListingSeller {
  id: string;
  name: string;
  avatarUrl?: string | null;
  rating?: number | null;
  verified?: boolean;
  sales?: number;
}

export interface StoreListingSafePoint {
  id: number;
  name: string;
}

export interface StoreListing {
  id: string;
  type: StoreListingType;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  priceType: StorePriceType;
  isNegotiable: boolean;
  condition: string | null;
  status: StoreListingStatus;
  deliveryType: StoreDeliveryType;
  campus: string | null;
  course: string | null;
  brand: string | null;
  model: string | null;
  quantity: number;
  isFeatured: boolean;
  category: StoreListingCategory;
  images: StoreListingImage[];
  seller: StoreListingSeller;
  safePoint: StoreListingSafePoint | null;
  location: string | null;
  createdAt: string;
  publishedAt: string | null;
  stats: { views: number; saves: number; contacts: number };
  viewerState: { saved: boolean; isMine: boolean; canEdit: boolean; canDelete: boolean; canReport: boolean };
}

export interface StoreNeed {
  id: string;
  label: string;
  subtitle: string;
  iconKey: string;
  matcher: (l: StoreListing) => boolean;
}

export interface StoreCategoryConfig {
  key: string;
  label: string;
  description: string;
  iconKey: string;
}

export interface SafePointData {
  id: number;
  name: string;
  campus?: string | null;
  description?: string | null;
  reference?: string | null;
  schedule?: string | null;
}

export interface ReportReason {
  value: string;
  label: string;
}

export interface QuickMessage {
  type: string;
  label: string;
  template: string;
}
