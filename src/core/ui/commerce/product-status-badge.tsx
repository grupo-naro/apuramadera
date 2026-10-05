/**
 * Badge del estado de un producto (borrador / publicado / archivado).
 */
import {
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
} from "@/core/modules/catalog/catalog.admin.schemas";
import { Badge } from "@/core/ui/badge";

const STATUS_VARIANT: Record<
  ProductStatus,
  "default" | "secondary" | "outline"
> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  );
}
