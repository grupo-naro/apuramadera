/**
 * Módulo Envíos — API pública.
 *
 * Fase 2 · M2.2 — cotización de envíos por zona. Para editar tarifas
 * y zonas, ver `shipping.config.ts`.
 */
export {
  getShippingMethods,
  findShippingMethod,
  type ShippingMethod,
  type ShippingMethodKind,
} from "./shipping";
