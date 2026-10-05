/**
 * Métodos de envío.
 *
 * Deriva la lista de métodos disponibles a partir de la config de
 * zonas: retiro en local + un envío a domicilio por zona. El checkout
 * (M2.4) muestra estos métodos y valida el elegido con
 * `findShippingMethod` — el costo SIEMPRE se resuelve en el servidor,
 * nunca se confía en el monto que manda el cliente.
 */
import { PICKUP, SHIPPING_ZONES } from "./shipping.config";

export type ShippingMethodKind = "pickup" | "delivery";

export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  /** Costo en centavos. */
  cost: number;
  kind: ShippingMethodKind;
}

/** Todos los métodos de envío disponibles para la tienda. */
export function getShippingMethods(): ShippingMethod[] {
  const methods: ShippingMethod[] = [];

  if (PICKUP.enabled) {
    methods.push({
      id: "pickup",
      label: PICKUP.label,
      description: PICKUP.description,
      cost: 0,
      kind: "pickup",
    });
  }

  for (const zone of SHIPPING_ZONES) {
    methods.push({
      id: `delivery-${zone.id}`,
      label: `Envío a domicilio · ${zone.label}`,
      description: zone.localities.join(" · "),
      cost: zone.rate,
      kind: "delivery",
    });
  }

  return methods;
}

/** Busca un método por id. `null` si no existe (id inválido o desactivado). */
export function findShippingMethod(id: string): ShippingMethod | null {
  return getShippingMethods().find((method) => method.id === id) ?? null;
}
