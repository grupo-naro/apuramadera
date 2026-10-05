"use client";

/**
 * Dispara el evento `purchase` cuando el cliente cae en la página de
 * la orden y ésta ya está PAGADA. Dedupea por orderId con
 * `localStorage` para que un refresh no cuente dos veces.
 */
import { useEffect } from "react";

import { trackPurchase, type TrackedItem } from "@/core/integrations/analytics";

interface PurchaseTrackerProps {
  orderId: string;
  /** Estado de la orden — sólo dispara si es "PAID". */
  status: string;
  /** Total cobrado en centavos. */
  value: number;
  /** Costo de envío en centavos. */
  shippingCost: number;
  items: TrackedItem[];
}

export function PurchaseTracker({
  orderId,
  status,
  value,
  shippingCost,
  items,
}: PurchaseTrackerProps) {
  useEffect(() => {
    if (status !== "PAID") return;
    if (typeof window === "undefined") return;
    const key = `mp-purchase-tracked-${orderId}`;
    if (window.localStorage.getItem(key)) return;

    trackPurchase({ orderId, value, shippingCost, items });
    window.localStorage.setItem(key, "1");
  }, [orderId, status, value, shippingCost, items]);

  return null;
}
