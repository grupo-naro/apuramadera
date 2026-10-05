"use client";

/**
 * Gestión de una orden desde el panel: cambio de estado + código de
 * seguimiento. El select sólo ofrece las transiciones válidas según
 * la máquina de estados (más el estado actual, para poder editar
 * sólo el tracking).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  canTransition,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/core/modules/orders/orders.status";
import { updateOrderAction } from "@/core/modules/orders/orders.actions";
import { Button } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: OrderStatus;
  trackingCode: string;
}

export function OrderStatusManager({
  orderId,
  currentStatus,
  trackingCode,
}: OrderStatusManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [tracking, setTracking] = useState(trackingCode);
  const [error, setError] = useState<string | null>(null);

  // El estado actual + los estados a los que se puede transicionar.
  const statusOptions = [
    currentStatus,
    ...ORDER_STATUSES.filter((s) => canTransition(currentStatus, s)),
  ];

  const dirty = status !== currentStatus || tracking !== trackingCode;

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderAction(orderId, {
        status,
        trackingCode: tracking,
      });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión del pedido</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="order-status">Estado</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as OrderStatus)}
          >
            <SelectTrigger id="order-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {ORDER_STATUS_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="order-tracking">Código de seguimiento</Label>
          <Input
            id="order-tracking"
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            placeholder="Opcional — se incluye en el email de despacho"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={onSave} disabled={pending || !dirty}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </CardContent>
    </Card>
  );
}
