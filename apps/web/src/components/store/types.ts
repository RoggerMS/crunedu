export type StoreListingType = "sale" | "exchange" | "donation" | "service" | "student_business" | "event";
export type StoreCategory = "books" | "printed_notes" | "calculators" | "technology" | "uniforms" | "materials" | "food" | "services" | "business" | "events" | "exchange" | "free";
export type StoreDeliveryType = "campus" | "safe_point" | "near_campus" | "off_campus" | "virtual";
export type StoreListingStatus = "available" | "reserved" | "sold" | "hidden" | "reported" | "draft";
export type StoreSort = "recent"|"low_price"|"high_price"|"near_me"|"verified"|"available"|"today"|"campus"|"off_campus";

export type StoreListing = { id:string; type:StoreListingType; title:string; description:string; price?:number; currency:"PEN"|"USD"; priceLabel?:string; category:StoreCategory; condition?:"new"|"like_new"|"used"|"needs_repair"; status:StoreListingStatus; badges:string[]; images:{id:string;url?:string;alt?:string}[]; seller:{id:string;name:string;avatarUrl?:string;rating?:number;verified?:boolean;sales?:number}; location?:string; deliveryType:StoreDeliveryType; deliveryMethod?:string; course?:string; faculty?:string; tags:string[]; createdAt:string; stats:{views:number;saves:number;contacts:number}; viewerState:{saved:boolean;isMine?:boolean};};

export type StoreNeed = { id:string; label:string; icon:string; matcher:(l:StoreListing)=>boolean };
