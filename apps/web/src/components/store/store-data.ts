import type { StoreCategoryConfig, StoreNeed, ReportReason, QuickMessage } from "./types";

export const STORE_CATEGORY_CONFIG: StoreCategoryConfig[] = [
  { key: "libros-separatas", label: "Libros y separatas", description: "Textos, copias y material de cursos", iconKey: "BookOpen" },
  { key: "calculadoras", label: "Calculadoras", description: "Científicas y básicas", iconKey: "Calculator" },
  { key: "materiales-utiles", label: "Materiales y útiles", description: "Cuadernos, mochilas y más", iconKey: "Backpack" },
  { key: "tecnologia", label: "Tecnología", description: "Laptops y accesorios", iconKey: "Laptop" },
  { key: "impresiones-copias", label: "Impresiones y copias", description: "Servicios de impresión", iconKey: "Printer" },
  { key: "servicios-academicos", label: "Servicios académicos", description: "Clases, tutorías y diseño", iconKey: "BriefcaseBusiness" },
  { key: "alimentacion", label: "Alimentación", description: "Comida en el campus", iconKey: "Utensils" },
  { key: "emprendimientos", label: "Emprendimientos", description: "Negocios estudiantiles", iconKey: "Rocket" },
  { key: "intercambios", label: "Intercambios", description: "Cambia sin pagar", iconKey: "Repeat2" },
  { key: "donaciones", label: "Donaciones", description: "Apoyo gratuito", iconKey: "Gift" },
];

export const storeNeeds: StoreNeed[] = [
  { id: "buy_book", label: "Buscar libro", subtitle: "por curso", iconKey: "BookMarked", matcher: (l) => l.category?.slug === "libros-separatas" || l.type === "sale" && (l.course != null) },
  { id: "print", label: "Imprimir / Anillar", subtitle: "servicios rápidos", iconKey: "Printer", matcher: (l) => l.title.toLowerCase().includes("impresi") || l.category?.slug === "impresiones-copias" },
  { id: "calculator", label: "Conseguir calculadora", subtitle: "para exámenes", iconKey: "Calculator", matcher: (l) => l.category?.slug === "calculadoras" },
  { id: "materials", label: "Comprar materiales", subtitle: "laboratorio y cursos", iconKey: "Package", matcher: (l) => l.category?.slug === "materiales-utiles" },
  { id: "food", label: "Comer en campus", subtitle: "pedidos y menú", iconKey: "Utensils", matcher: (l) => l.category?.slug === "alimentacion" },
  { id: "free", label: "Donaciones", subtitle: "apoyo entre estudiantes", iconKey: "Gift", matcher: (l) => l.type === "donation" || l.category?.slug === "donaciones" },
  { id: "exchange", label: "Intercambios", subtitle: "cambia sin pagar", iconKey: "Repeat2", matcher: (l) => l.type === "exchange" || l.category?.slug === "intercambios" },
  { id: "services", label: "Servicios académicos", subtitle: "reforzamiento y apoyo", iconKey: "BriefcaseBusiness", matcher: (l) => l.type === "service" || l.category?.slug === "servicios-academicos" },
  { id: "business", label: "Emprendimientos", subtitle: "negocios estudiantiles", iconKey: "Rocket", matcher: (l) => l.category?.slug === "emprendimientos" },
  { id: "laptop", label: "Tecnología", subtitle: "laptops y accesorios", iconKey: "Laptop", matcher: (l) => l.category?.slug === "tecnologia" },
];

export const STORE_REPORT_REASONS: ReportReason[] = [
  { value: "PRODUCT_FORBIDDEN", label: "Producto prohibido" },
  { value: "FRAUD", label: "Fraude o sospecha" },
  { value: "MISLEADING", label: "Información engañosa" },
  { value: "FAKE_PRICE", label: "Precio falso" },
  { value: "DUPLICATE", label: "Duplicado" },
  { value: "OFFENSIVE", label: "Contenido ofensivo" },
  { value: "PERSONAL_DATA", label: "Datos personales" },
  { value: "SPAM", label: "Spam" },
  { value: "SOLD_STILL_ACTIVE", label: "Producto vendido que sigue activo" },
  { value: "OTHER", label: "Otro" },
];

export const QUICK_MESSAGES: QuickMessage[] = [
  { type: "AVAILABILITY", label: "¿Sigue disponible?", template: "Hola, ¿este producto sigue disponible?" },
  { type: "PRICE", label: "¿El precio es negociable?", template: "Hola, me interesa. ¿El precio es negociable?" },
  { type: "LOCATION", label: "¿Dónde coordinar?", template: "Hola, ¿dónde podríamos coordinar la entrega?" },
  { type: "RESERVE", label: "Quiero reservarlo", template: "Hola, me interesa reservar este producto. ¿Es posible?" },
  { type: "CUSTOM", label: "Escribir mensaje", template: "" },
];
