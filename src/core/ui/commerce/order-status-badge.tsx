/**
 * Badge del estado de una orden — etiqueta + color por estado.
 * Compartido entre el storefront (confirmación) y el panel admin.
 */
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/core/modules/orders";
import { Badge } from "@/core/ui/badge";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING: "secondary",
  PAID: "default",
  FULFILLED: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
