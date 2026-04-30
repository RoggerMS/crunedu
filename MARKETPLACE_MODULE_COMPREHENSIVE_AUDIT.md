# Marketplace Module Comprehensive Audit

## Executive Summary

The CrunEdu marketplace ("Tienda") is a **basic store management system** designed for CrunEdu-administered products only. The module spans frontend (React/Next.js) and backend (NestJS/Prisma) with public catalog browsing and admin product management. The current implementation is **functional for MVP** but has gaps in validation, type safety, and error handling.

---

## 1. FRONTEND TIENDA (Apps/Web)

### 1.1 Directory Structure

```
apps/web/src/app/app/tienda/
├── page.tsx              # Catalog listing page
└── [id]/
    └── page.tsx          # Product detail page
```

### 1.2 Frontend Pages

#### **Tienda Catalog Page** (`/app/tienda`)

**File:** [apps/web/src/app/app/tienda/page.tsx](apps/web/src/app/app/tienda/page.tsx)

**Functionality:**

- Displays featured products section (up to 6 products)
- Lists all active products in grid (12 default, 40 max per pagination)
- Reads `profile_faculty` and `profile_career` from localStorage
- Passes context filters to API for contextual product recommendations

**State Management:**

```typescript
- products: Product[]          // Main catalog
- featuredProducts: Product[]  // Featured section
- loading: boolean
- error: string | null
```

**UI Components Used:**

- `PageState` (for loading, error, empty states)
- `PrimaryButton` (for retry action)
- `Link` (Next.js routing to detail page)

**Error Handling:**

- ✅ Catches API errors and maps them via `mapApiError()`
- ✅ Shows user-friendly error messages in Spanish
- Provides retry button

**Issues Identified:**

- **Missing Type Exports:** `Product` type is locally defined, not imported from `@crunedu/shared`
- **No Empty State Validation:** If `data?.items` is null, arrays are initialized but no validation on structure
- **Pagination Not Implemented:** No cursor handling or "Load More" button visible
- **Context Filtering Weak:** Faculty/career filters are string searches, not structured category filters

---

#### **Product Detail Page** (`/app/tienda/[id]`)

**File:** [apps/web/src/app/app/tienda/[id]/page.tsx](apps/web/src/app/app/tienda/[id]/page.tsx)

**Functionality:**

- Loads product by ID from API
- Displays product details (title, description, price, category)
- Shows "Me interesa este producto" (Express Interest) button
- Only authenticated users can send inquiry

**State Management:**

```typescript
- product: ProductDetailResponse | null
- loading: boolean
- error: string | null
- message: string | null     // Feedback message
- sending: boolean           // Inquiry submission state
```

**Error Handling:**

- ✅ Validates productId is finite before API call
- ✅ Shows error state with error message
- ✅ Handles missing product gracefully
- ✅ Shows feedback message after inquiry submission

**UI States:**

- Loading state: "Cargando producto..."
- Error state: Error message in rose/red border
- Not found: "Producto no disponible en este momento."
- Success inquiry: "Interés enviado. Pronto te contactaremos."

**Issues Identified:**

- **Hardcoded Contact Info:** ContactName and ContactPhone are hardcoded ("Estudiante CrunEdu" / "999999999")
  - Should use authenticated user data
  - Should use actual contact form
- **No Input Validation:** Message field is hardcoded, no user-provided text
- **No User Data Injection:** The inquiry payload doesn't capture actual student information
- **Missing Toast/Modal:** Message disappears without persistent notification
- **No Product Images:** Schema has `ProductImage` model, but detail page doesn't display them

---

### 1.3 API Helper Functions

**File:** [apps/web/src/lib/api-helpers.ts](apps/web/src/lib/api-helpers.ts#L20-L85)

**Defined Functions:**

| Function                                        | Endpoint                                    | Auth      | Purpose                     |
| ----------------------------------------------- | ------------------------------------------- | --------- | --------------------------- |
| `getStoreCatalog(params)`                       | GET `/marketplace/products`                 | None      | Fetch products with filters |
| `getStoreProductDetail(productId)`              | GET `/marketplace/products/{id}`            | None      | Fetch single product        |
| `createStoreInquiry(productId, payload, token)` | POST `/marketplace/products/{id}/inquiries` | JWT       | Submit interest in product  |
| `getStoreCategories()`                          | GET `/marketplace/categories`               | None      | Fetch category list         |
| `createAdminProduct(payload, token)`            | POST `/marketplace/admin/products`          | JWT+ADMIN | Create/update product       |

**Type Definitions:**

```typescript
type Product = {
  id: number;
  title: string;
  description: string;
  price: string; // ⚠️ String, not number
  isFeatured: boolean;
  category: { name: string };
};

export type CatalogResponse = {
  items: Product[];
  featuredProducts: Product[];
  nextCursor: number | null;
};

export type ProductDetailResponse = Product & {
  contactMethod?: string;
  stock?: number;
  viewCount?: number;
};
```

**Issues Identified:**

- **Type Safety Issue:** `price` is `string` in frontend types, but Prisma schema has `Decimal(10, 2)`
- **Missing Types:** No dedicated DTO interfaces for request/response payloads
- **No Error Types:** Inquiry payload type is inferred, not formally defined
- **Incomplete Types:** `ProductDetailResponse` doesn't include `admin` info returned by API
- **No Category Response Type:** `getStoreCategories()` returns untyped array

---

### 1.4 Frontend Hooks

**Search for marketplace hooks:** No dedicated hooks found.

**Current Usage:**

- `useAccessToken()` - Auth token management
- Direct API calls via `api-helpers.ts`

**Issues Identified:**

- **No Marketplace Hooks:** Should have custom hooks for:
  - `useStoreCatalog()` - manage catalog state, pagination, filtering
  - `useStoreInquiry()` - manage inquiry submission state
  - `useProductDetail()` - manage product detail loading

---

### 1.5 Frontend Components

**Search for marketplace-specific components:** None found.

**Current Components Using Marketplace:**

- Generic: `PageState`, `PrimaryButton`, `Link`
- No dedicated product cards, inquiry forms, or category filters

**Issues Identified:**

- **Missing Components:**
  - `ProductCard.tsx` - reusable product display
  - `InquiryForm.tsx` - contact form for inquiry
  - `CategoryFilter.tsx` - category selection UI
  - `FeaturedProductsList.tsx` - featured section
  - `ProductImages.tsx` - image gallery

---

## 2. BACKEND MARKETPLACE API (Apps/API)

### 2.1 Module Structure

```
apps/api/src/modules/marketplace/
├── marketplace.controller.ts   # HTTP endpoints
├── marketplace.service.ts      # Business logic
└── marketplace.module.ts       # NestJS module
```

### 2.2 Controller Endpoints

**File:** [apps/api/src/modules/marketplace/marketplace.controller.ts](apps/api/src/modules/marketplace/marketplace.controller.ts)

| Method | Endpoint                              | Auth | Handler            | Purpose                       |
| ------ | ------------------------------------- | ---- | ------------------ | ----------------------------- |
| GET    | `/marketplace/categories`             | None | `categories()`     | List all product categories   |
| GET    | `/marketplace/products`               | None | `products()`       | List products with filters    |
| GET    | `/marketplace/products/:id`           | None | `productDetail()`  | Get single product details    |
| POST   | `/marketplace/products/:id/inquiries` | JWT  | `inquiry()`        | Submit product inquiry        |
| POST   | `/marketplace/admin/products`         | JWT  | `upsertProduct()`  | Create/update product (admin) |
| GET    | `/marketplace/admin/inquiries`        | JWT  | `adminInquiries()` | List all inquiries (admin)    |
| GET    | `/marketplace/admin/metrics`          | JWT  | `metrics()`        | Conversion metrics (admin)    |

**Query Parameters:**

- `GET /products`: `categoryId`, `faculty`, `career`, `cursor`, `limit`
- `GET /admin/inquiries`: `cursor`, `limit`

**Issues Identified:**

- **No DTO Validation:** Controller doesn't use class validators
  - `@Body() body: unknown` is too loose
  - Should have `CreateInquiryDto`, `UpsertProductDto`
- **No Request/Response DTOs:** Mixing direct Prisma models with API responses
- **No Pagination DTOs:** Cursor/limit are raw `string` and manually converted
- **Admin Endpoints Lack Authorization Check:** Only role check is in service, not in controller guards
- **No Rate Limiting:** No protection against inquiry spam

---

### 2.3 Service Logic

**File:** [apps/api/src/modules/marketplace/marketplace.service.ts](apps/api/src/modules/marketplace/marketplace.service.ts)

#### **Method: `listCategories()`**

```typescript
async listCategories() {
  return this.prisma.productCategory.findMany({ orderBy: { name: "asc" } });
}
```

- Simple, no pagination
- No caching

#### **Method: `listCatalog()`**

- Filters by `status: "ACTIVE"`
- Supports categoryId filter
- Supports context filters (faculty, career) via text search in title/description
- Returns featured products separately
- Cursor-based pagination with configurable limits
- **Pagination limits:** default 12, max 40 products

**Context Filter Logic:**

```typescript
// Searches title, description, and category.name for faculty/career values
// Uses insensitive contains matching
```

**Issues:**

- ⚠️ Context filtering is **text-based, not relational**
  - Should join with Profile → Faculty/Career for accuracy
  - Current approach returns false positives
- ⚠️ **Duplicate queries:** Featured products use separate query (not cached)
- ⚠️ **No result caching:** Every request hits database

#### **Method: `getProductDetail()`**

- Increments `viewCount` with each fetch
- Returns product with category and admin email
- Throws `NotFoundException` if product not found or not ACTIVE

**Issues:**

- ⚠️ **Race condition:** View count increment is unsynchronized (can lose counts)
- ⚠️ **No image loading:** Schema has `ProductImage` relation but not included in response
- ⚠️ **Admin email exposure:** Returns `admin: { id, email }` to public endpoint

#### **Method: `createInquiry()`**

- Validates required fields: `contactName`, `contactPhone`, `message`, `preferredContactMethod`
- Increments product `contactClickCount`
- Creates inquiry with `status: NEW`

**Issues:**

- ❌ **No input validation:** Only presence checks, no:
  - Phone format validation
  - Message length limits
  - Email format validation for contact method
- ❌ **No deduplication:** User can spam inquiries on same product
- ❌ **No contact method validation:** Accepts any string for `preferredContactMethod`
- ❌ **Hardcoded user contact info in frontend** means backend receives incorrect data

#### **Method: `adminListInquiries()`**

- Lists all inquiries paginated
- Includes product title and user email
- No authorization check in method (only in controller)

**Issues:**

- ⚠️ **No admin guard check:** Relies on controller JWT guard, not role-based
- ⚠️ **No ordering by status:** Important inquiries not prioritized

#### **Method: `adminUpsertProduct()`**

- Creates or updates product
- Role check: only ADMIN
- Auto-generates `createdBy: user.sub`

**Issues:**

- ❌ **No field validation on upsert:**
  - No price validation (could be negative)
  - No stock validation
  - No title/description length limits
- ⚠️ **Dangerous updates:** Missing fields aren't validated
- ⚠️ **No image handling:** Images not included in upsert logic

#### **Method: `getConversionMetrics()`**

- Returns product view/contact counts
- Summarizes inquiries by status

**Issues:**

- ⚠️ **Performance:** No filtering, loads all products into memory
- ⚠️ **Incomplete metrics:** No conversion rate calculation
- ⚠️ **Missing time windows:** No date range filtering

---

### 2.4 NestJS Module

**File:** [apps/api/src/modules/marketplace/marketplace.module.ts](apps/api/src/modules/marketplace/marketplace.module.ts)

```typescript
@Module({
  imports: [PrismaModule, JwtSharedModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
```

**Issues:**

- ✅ Properly imports dependencies
- ⚠️ No configuration module
- ⚠️ No guard module imports

---

## 3. DATABASE SCHEMA (Prisma)

### 3.1 Product Models

#### **ProductCategory**

```prisma
model ProductCategory {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  products    Product[]
}
```

#### **Product**

```prisma
model Product {
  id              Int           @id @default(autoincrement())
  title           String
  description     String
  price           Decimal(10,2)
  currency        String        @default("PEN")
  categoryId      Int
  status          ProductStatus @default(DRAFT)
  stock           Int           @default(1)
  isFeatured      Boolean       @default(false)
  contactMethod   String        @map("contact_method")
  whatsappMessage String?       @map("whatsapp_message")
  viewCount       Int           @default(0)
  contactClickCount Int         @default(0)
  createdBy       Int
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  category  ProductCategory   @relation(fields: [categoryId], references: [id])
  admin     User              @relation(fields: [createdBy], references: [id])
  images    ProductImage[]
  favorites ProductFavorite[]
  inquiries ProductInquiry[]
  reports   Report[]
}
```

**Status Enum:**

```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  HIDDEN
  SOLD_OUT
  DELETED
}
```

#### **ProductImage**

```prisma
model ProductImage {
  id         Int      @id @default(autoincrement())
  productId  Int
  imageUrl   String
  storageKey String
  position   Int      @default(0)
  createdAt  DateTime @default(now())
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

#### **ProductFavorite**

```prisma
model ProductFavorite {
  id        Int      @id @default(autoincrement())
  userId    Int
  productId Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@unique([userId, productId])
}
```

#### **ProductInquiry**

```prisma
model ProductInquiry {
  id                     Int           @id @default(autoincrement())
  productId              Int
  userId                 Int
  contactName            String
  contactPhone           String
  message                String
  preferredContactMethod String
  status                 InquiryStatus @default(NEW)
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  product Product @relation(fields: [productId], references: [id])
  user    User    @relation(fields: [userId], references: [id])
}
```

**InquiryStatus Enum:**

```prisma
enum InquiryStatus {
  NEW
  CONTACTED
  CLOSED
  CANCELLED
}
```

### 3.2 Schema Issues

| Issue                               | Severity  | Details                                           |
| ----------------------------------- | --------- | ------------------------------------------------- |
| Missing indexes on `ProductInquiry` | ⚠️ Medium | Should index `(status, createdAt)` for admin list |
| `whatsappMessage` not used          | ⚠️ Low    | Dead field, consider removing                     |
| `contactMethod` validation          | ❌ High   | No constraint, should be enum or check constraint |
| No soft-delete for products         | ⚠️ Medium | Using DELETED status instead of paranoid pattern  |
| `viewCount` race condition          | ❌ High   | Non-atomic increment operation                    |
| No unique constraint on inquiries   | ⚠️ Medium | User can create duplicate inquiries easily        |

---

## 4. ERROR HANDLING ANALYSIS

### 4.1 Backend Error Responses

**Currently Thrown:**

- `NotFoundException` - Product not found
- `BadRequestException` - Missing inquiry fields
- `ForbiddenException` - Non-admin tries admin operation

**Missing Error Cases:**

- Invalid product ID (should validate before Prisma)
- Invalid category ID
- Invalid pagination limits
- Duplicate inquiry submission
- Price validation (negative price)
- Product status validation

### 4.2 Frontend Error Mapping

**File:** [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts#L8-L37)

```typescript
export const USER_ERROR_MESSAGES = {
  network:
    "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
  unauthorized: "Tu sesión expiró. Inicia sesión nuevamente para continuar.",
  forbidden: "No tienes permiso para realizar esta acción.",
  generic: "Ocurrió un error inesperado. Inténtalo nuevamente.",
};
```

**Handling:**

- 401 → "Tu sesión expiró"
- 403 → "No tienes permiso"
- No status → "No se pudo conectar"
- Other → fallback or custom message

**Issues:**

- ⚠️ All 4xx errors except 401/403 use fallback
- ⚠️ No specific handling for 400 Bad Request validation errors
- ⚠️ No 404 specific message

---

## 5. TYPE SAFETY AUDIT

| Component          | Type Safety Level | Issues                                     |
| ------------------ | ----------------- | ------------------------------------------ |
| Frontend API types | ⚠️ Partial        | Price as string, missing response types    |
| Backend DTOs       | ❌ None           | No DTO classes, `body: unknown` everywhere |
| Controller params  | ⚠️ Weak           | Manual string-to-number conversion         |
| Service methods    | ✅ Good           | Proper Prisma typing                       |
| Pagination types   | ❌ Missing        | Cursor/limit are raw numbers               |

**Specific Type Issues:**

1. **Price Type Mismatch:**
   - Prisma: `Decimal(10, 2)`
   - Frontend: `string`
   - API response: serialized as string

2. **Missing DTOs:**

   ```typescript
   // Should exist but don't:
   CreateInquiryDto;
   UpdateProductDto;
   CreateProductDto;
   PaginationQueryDto;
   ListInquiriesQueryDto;
   ```

3. **Loose Body Types:**

   ```typescript
   // Current (bad):
   @Body() body: unknown

   // Should be:
   @Body() dto: CreateInquiryDto
   ```

---

## 6. LOADING & STATE MANAGEMENT PATTERNS

### 6.1 Frontend State Management

**Pattern Used:** React `useState` hooks

**Example (Catalog Page):**

```typescript
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  getStoreCatalog(params)
    .then((data) => setProducts(data?.items))
    .catch((err) => setError(mapApiError(err)))
    .finally(() => setLoading(false));
}, [accessToken]);
```

**Issues:**

- ⚠️ No pagination state management (cursor, limit not tracked)
- ⚠️ No loading states for individual items
- ⚠️ No retry logic (only manual button click)
- ⚠️ No request debouncing/cancellation

### 6.2 Backend Query Patterns

**Cursor-Based Pagination:**

```typescript
const items = await this.prisma.product.findMany({
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  take: safeLimit + 1,
});
const nextCursor = items.length > safeLimit ? items[safeLimit].id : null;
```

**Issues:**

- ✅ Safe limit enforcement
- ⚠️ No offset fallback for clients without cursor support
- ⚠️ Fetches N+1 items to detect next cursor

---

## 7. MISSING ERROR CASES

### Frontend

| Scenario                                | Current Behavior                | Should Be                          |
| --------------------------------------- | ------------------------------- | ---------------------------------- |
| Product ID is NaN                       | Shows "Producto no válido"      | ✅ OK                              |
| Network timeout during catalog load     | Shows generic error             | ⚠️ Should show "Conexión lenta..." |
| User clicks "Me interesa" while offline | Creates error message           | ⚠️ Should disable button           |
| Inquiry submission timeout              | Shows error, but doesn't retry  | ⚠️ Should offer retry option       |
| Hardcoded inquiry data invalid          | Creates inquiry with wrong data | ❌ Major: Should use form inputs   |

### Backend

| Scenario                         | Current Behavior                    | Should Be                    |
| -------------------------------- | ----------------------------------- | ---------------------------- |
| Product price = -100             | Creates product with negative price | ❌ Should reject             |
| Stock = -1                       | Creates product with negative stock | ❌ Should reject             |
| Duplicate inquiry from same user | Creates new inquiry                 | ⚠️ Should deduplicate        |
| Invalid category ID              | Constraint violation, 500 error     | ❌ Should return 400         |
| Contact phone format             | Accepts any string                  | ⚠️ Should validate format    |
| Empty title/description          | Accepts empty strings               | ⚠️ Should require min length |

---

## 8. AUTHENTICATION & AUTHORIZATION

### Protected Endpoints

| Endpoint             | Auth Type | Role Check         | Issue                    |
| -------------------- | --------- | ------------------ | ------------------------ |
| POST /inquiries      | JWT       | None (public user) | ✅ OK                    |
| POST /admin/products | JWT       | ADMIN role         | ⚠️ Check only in service |
| GET /admin/inquiries | JWT       | ADMIN role         | ⚠️ Check only in service |
| GET /admin/metrics   | JWT       | ADMIN role         | ⚠️ Check only in service |

**Issues:**

- ⚠️ Admin role check should be in controller guard, not service
- ⚠️ No separate ADMIN role guard, relying on JwtAuthGuard only
- ✅ Public endpoints correctly have no guards

---

## 9. API CONTRACT SUMMARY

### Response Shapes

#### `GET /marketplace/categories`

```typescript
Array<{
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}>;
```

#### `GET /marketplace/products`

```typescript
{
  items: Product[];
  featuredProducts: Product[];
  nextCursor: number | null;
  context: {
    faculty: string;
    career: string;
  }
}
```

#### `GET /marketplace/products/:id`

```typescript
{
  id: number;
  title: string;
  description: string;
  price: Decimal;
  category: {
    id: number;
    name: string;
  }
  admin: {
    id: number;
    email: string;
  }
  viewCount: number;
  // ... other fields
}
```

#### `POST /marketplace/products/:id/inquiries`

**Request:**

```typescript
{
  contactName: string;
  contactPhone: string;
  message: string;
  preferredContactMethod: "whatsapp" | "email";
}
```

**Response:**

```typescript
{
  id: number;
  productId: number;
  userId: number;
  contactName: string;
  contactPhone: string;
  message: string;
  preferredContactMethod: string;
  status: "NEW" | "CONTACTED" | "CLOSED" | "CANCELLED";
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

---

## 10. PAGINATION CONFIGURATION

**Limits Defined:** [apps/api/src/modules/common/pagination.constants.ts](apps/api/src/modules/common/pagination.constants.ts)

```typescript
export const PAGINATION_LIMITS = {
  marketplaceProducts: { default: 12, max: 40 },
  marketplaceFeaturedProducts: { default: 6, max: 12 },
  marketplaceInquiries: { default: 20, max: 50 },
};
```

**Behavior:**

- Default: 12 products per page
- Max: 40 products per request
- Featured: Always 6 products (non-paginated)
- Inquiries: 20 per page

**Issues:**

- ⚠️ Featured products are always fetched fresh (not cached)
- ⚠️ No infinite scroll support, would need client-side pagination logic

---

## 11. EXISTING FUNCTIONALITY SUMMARY

### What Works ✅

1. **Product Catalog Listing**
   - Public endpoint, no auth required
   - Filter by category, faculty, career
   - Cursor-based pagination
   - Featured products section

2. **Product Detail View**
   - Public endpoint
   - Shows product info, price, category
   - Tracks views

3. **Product Inquiry System**
   - Authenticated users can submit interest
   - Inquiry stored in database
   - Admin can view all inquiries

4. **Admin Product Management**
   - Admins can create/update products
   - Set featured status
   - Configure contact method

5. **Conversion Metrics**
   - Endpoint for view counts
   - Inquiry status summary

6. **Database Schema**
   - Well-designed models
   - Proper relationships
   - Indexes on common queries

### What's Broken ❌

1. **Hardcoded Inquiry Data**
   - Frontend sends fake contact info
   - Backend doesn't validate user data

2. **No Product Images**
   - Schema supports them
   - Not displayed in frontend
   - Not handled in admin product creation

3. **Context Filtering**
   - Faculty/career search is text-based
   - Not relational to user profile
   - Returns false positives

4. **Type Safety**
   - No DTOs
   - Price type mismatch
   - Unknown body types

### What's Missing ❌

1. **Input Validation**
   - No price validation
   - No phone format validation
   - No message length limits

2. **Duplicate Prevention**
   - User can spam inquiries

3. **Frontend Form**
   - Inquiry form is hardcoded
   - Should accept user input

4. **Error Messages**
   - Only basic error mapping
   - No specific validation errors shown

5. **Caching**
   - No product caching
   - Categories fetched every time

6. **Rate Limiting**
   - No protection against inquiry spam

7. **Admin Dashboard**
   - No UI for managing products
   - No UI for viewing inquiries
   - Metrics endpoint exists but unused

8. **Product Images**
   - Schema ready but not implemented

---

## 12. RISK ASSESSMENT

### High Risk 🔴

1. **Hardcoded Inquiry Contact Data**
   - All inquiries have fake student info
   - Admin receives unusable data
   - Must fix before going live

2. **No Price Validation**
   - Could create negative-price products
   - Could break calculations

3. **Admin Authorization**
   - Check is in service, not controller
   - Could be bypassed if refactored

### Medium Risk 🟡

1. **Type Mismatches**
   - Frontend/backend price type mismatch
   - Could cause serialization issues

2. **Pagination Without Caching**
   - Hitting database for every request
   - Will slow down with 1000+ products

3. **Context Filtering Accuracy**
   - Text search instead of relational join
   - Could recommend wrong products

4. **View Count Race Condition**
   - Non-atomic increment could lose counts

### Low Risk 🟢

1. **Missing Optional Features**
   - Images, favorites, advanced metrics
   - Not required for MVP

2. **No Rate Limiting**
   - Not critical for closed beta
   - Can add before public launch

---

## 13. VERIFICATION COMMANDS

### Check Endpoints Working

```powershell
# Catalog
Invoke-RestMethod http://localhost:4000/api/marketplace/products

# Categories
Invoke-RestMethod http://localhost:4000/api/marketplace/categories

# Product Detail
Invoke-RestMethod http://localhost:4000/api/marketplace/products/1

# Create Inquiry (requires JWT token)
$body = @{
  contactName = "Test Student"
  contactPhone = "999999999"
  message = "Interested in this product"
  preferredContactMethod = "whatsapp"
} | ConvertTo-Json

Invoke-RestMethod http://localhost:4000/api/marketplace/products/1/inquiries `
  -Method POST `
  -Headers @{
    Authorization = "Bearer YOUR_TOKEN_HERE"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

### Frontend Verification

- Navigate to `http://localhost:3000/app/tienda`
- Should load products from API
- Click on product should navigate to detail page
- "Me interesa" button should work when logged in

---

## 14. RECOMMENDED QUICK WINS

### Phase 1: Fix Critical Issues (URGENT)

1. Replace hardcoded inquiry contact data with form inputs
2. Add price and stock validation to product creation
3. Move admin role check to controller guard

### Phase 2: Type Safety (IMPORTANT)

1. Create DTOs for all request/response types
2. Fix price type to use Decimal correctly
3. Add class validators to DTOs

### Phase 3: Functionality (NICE-TO-HAVE)

1. Implement product image display
2. Add duplicate inquiry prevention
3. Implement featured products caching
4. Build admin product management UI

### Phase 4: UX Improvements

1. Add pagination UI (Load More button)
2. Add category filter buttons
3. Implement product favorites
4. Show inquiry status to users

---

## 15. FILE REFERENCE GUIDE

### Frontend Files

- [apps/web/src/app/app/tienda/page.tsx](apps/web/src/app/app/tienda/page.tsx) - Catalog page
- [apps/web/src/app/app/tienda/[id]/page.tsx](apps/web/src/app/app/tienda/[id]/page.tsx) - Detail page
- [apps/web/src/lib/api-helpers.ts](apps/web/src/lib/api-helpers.ts) - API functions
- [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts) - Error mapping

### Backend Files

- [apps/api/src/modules/marketplace/marketplace.controller.ts](apps/api/src/modules/marketplace/marketplace.controller.ts) - Endpoints
- [apps/api/src/modules/marketplace/marketplace.service.ts](apps/api/src/modules/marketplace/marketplace.service.ts) - Logic
- [apps/api/src/modules/marketplace/marketplace.module.ts](apps/api/src/modules/marketplace/marketplace.module.ts) - Module

### Database Files

- [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) - Product models
- [apps/api/src/modules/common/pagination.constants.ts](apps/api/src/modules/common/pagination.constants.ts) - Pagination config

---

## END OF AUDIT

Generated: 2026-04-30
