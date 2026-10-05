/**
 * Tipos de dominio del catálogo.
 *
 * Son la forma en que el resto de la app "ve" el catálogo: shapes
 * limpios, sin rastro de Prisma. El repositorio mapea las filas de
 * la base a estos tipos; los use cases y el storefront sólo conocen
 * estos.
 *
 * Todo el dinero está en centavos (Int). 3990 = $39,90.
 */

// ─── Categorías ────────────────────────────────────────────────

/** Datos mínimos de una categoría (para chips, links, breadcrumbs). */
export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

/** Categoría completa, tal como la devuelve el repositorio (plana). */
export interface Category extends CategorySummary {
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
}

/** Nodo del árbol de categorías — para la navegación del storefront. */
export interface CategoryTreeNode extends CategorySummary {
  description: string | null;
  imageUrl: string | null;
  children: CategoryTreeNode[];
}

/** Categoría con su contexto: ruta de ancestros e hijas directas. */
export interface CategoryDetail extends CategorySummary {
  description: string | null;
  imageUrl: string | null;
  /** Ancestros incluida la propia categoría — para breadcrumbs (M1.6). */
  breadcrumb: CategorySummary[];
  children: CategorySummary[];
}

// ─── Productos ─────────────────────────────────────────────────

export interface ProductImage {
  /** public_id del asset en Cloudinary. */
  publicId: string;
  alt: string | null;
}

/** Rango de precios de las variantes activas de un producto. */
export interface PriceRange {
  min: number;
  max: number;
}

/** Producto para grillas y listados — datos mínimos para una card. */
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  /** Imagen principal (la de menor `sortOrder`), o null si no tiene. */
  image: ProductImage | null;
  priceRange: PriceRange;
  /** Precio "tachado" de la variante más barata, si hay descuento. */
  compareAtPrice: number | null;
  inStock: boolean;
  categories: CategorySummary[];
}

export interface ProductOptionValue {
  id: string;
  value: string;
}

/** Eje de variación del producto: "Talle", "Color"… con sus valores. */
export interface ProductOption {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

/** Unidad vendible: lo que se agrega al carrito. */
export interface ProductVariant {
  id: string;
  sku: string | null;
  name: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  inStock: boolean;
  /** IDs de los `ProductOptionValue` que definen esta variante. */
  optionValueIds: string[];
}

/** Producto completo — para la página de detalle (PDP). */
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImage[];
  /** `publicId` del modelo 3D `.glb` en Cloudinary (`raw`), o null. */
  modelGlbPublicId: string | null;
  /** `publicId` del `.usdz` para iOS Quick Look, o null. */
  modelUsdzPublicId: string | null;
  categories: CategorySummary[];
  options: ProductOption[];
  variants: ProductVariant[];
  priceRange: PriceRange;
  inStock: boolean;
}

// ─── Resultados paginados ──────────────────────────────────────

export interface ProductListResult {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
