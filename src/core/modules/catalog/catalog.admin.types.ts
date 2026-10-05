/**
 * Tipos de dominio del catálogo para el panel admin.
 *
 * A diferencia de `catalog.types`, acá los productos incluyen
 * borradores/archivados y datos de gestión (stock total, estado).
 */
import type {
  CategoryFormInput,
  ProductFormInput,
  ProductStatus,
} from "./catalog.admin.schemas";

/** Fila del listado de productos del panel. */
export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  /** public_id de la imagen principal en Cloudinary, o null. */
  imagePublicId: string | null;
  variantCount: number;
  /** Precio de la variante más barata, en centavos. */
  price: number;
  /** Suma del stock de todas las variantes. */
  totalStock: number;
  updatedAt: Date;
}

/**
 * Producto cargado para editar = los `defaultValues` del formulario
 * (mismos campos string, precios en pesos) más su `id`.
 */
export type AdminProductForEdit = ProductFormInput & { id: string };

/** Categoría como opción del formulario — `depth` para indentar el árbol. */
export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  depth: number;
}

/** Nodo del listado de categorías del panel (árbol aplanado). */
export interface AdminCategoryNode {
  id: string;
  name: string;
  slug: string;
  depth: number;
  isActive: boolean;
  productCount: number;
}

/** Categoría cargada para editar = los campos del formulario + su `id`. */
export type AdminCategoryForEdit = CategoryFormInput & { id: string };
