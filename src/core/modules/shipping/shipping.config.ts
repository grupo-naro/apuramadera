/**
 * Configuración de envíos de la tienda.
 *
 * ░░ EDITAR POR CLIENTE ░░
 * Esta es la tabla de tarifas. Acá van los precios del transporte que
 * use cada tienda — moto-mensajería, Andreani, Correo Argentino, etc.
 * El cliente elige su zona en el checkout y se aplica la tarifa.
 *
 * (En la Fase 4 esto se integra a `store.config.ts`; en la Fase 5 se
 * suman proveedores con API real —Andreani/OCA— como adaptadores.)
 *
 * Tarifas en centavos (500000 = $5.000).
 */

import { storeConfig } from "@/store.config";

export interface ShippingZoneConfig {
  id: string;
  label: string;
  /** Tarifa en centavos. */
  rate: number;
  /** Localidades que cubre — el cliente las usa para ubicar su zona. */
  localities: string[];
}

/**
 * Retiro en sucursal (sin costo). Poné `enabled: false` para ocultarlo.
 * La dirección sale de `store.config.ts` (`contact.address`), así está
 * en un solo lugar.
 */
export const PICKUP = {
  enabled: true,
  label: "Retiro en sucursal",
  description: storeConfig.contact.address
    ? `Retirás en nuestro showroom: ${storeConfig.contact.address}. Coordinás el día y el horario con la tienda después de la compra.`
    : "Coordinás el retiro con la tienda después de la compra.",
};

/**
 * ¿Se ofrece envío a domicilio por zona? Por ahora NO: la tienda sólo
 * trabaja con retiro en sucursal. Poné `true` para volver a ofrecer las
 * zonas de abajo (siguen cargadas).
 */
export const DELIVERY_ENABLED = false;

/** Zonas de envío a domicilio, de menor a mayor tarifa. */
export const SHIPPING_ZONES: ShippingZoneConfig[] = [
  {
    id: "caba-merlo",
    label: "CABA y Merlo",
    rate: 500000,
    localities: ["Ciudad de Buenos Aires (CABA)", "Merlo"],
  },
  {
    id: "z1",
    label: "Zona 1 · 1.er cordón",
    rate: 600000,
    localities: ["Ituzaingó", "Morón", "Castelar", "Moreno"],
  },
  {
    id: "z2",
    label: "Zona 2 · 2.º cordón",
    rate: 750000,
    localities: [
      "Hurlingham",
      "La Matanza (norte y sur)",
      "Lomas de Zamora",
      "Lanús",
      "San Martín",
      "San Fernando",
      "Vicente López",
      "José C. Paz",
      "Malvinas Argentinas",
      "San Miguel",
      "Tigre",
      "Florencio Varela",
      "Almirante Brown",
      "Esteban Echeverría",
      "Ezeiza",
      "Quilmes",
      "Berazategui",
    ],
  },
  {
    id: "z3",
    label: "Zona 3 · 3.er cordón",
    rate: 850000,
    localities: [
      "La Plata",
      "Zárate",
      "Campana",
      "Escobar",
      "Pilar",
      "Luján",
      "General Rodríguez",
      "Cañuelas",
      "San Vicente",
      "Del Viso",
      "Nordelta",
      "Ingeniero Maschwitz",
      "Villa Rosa",
      "Alejandro Korn",
      "Marcos Paz",
    ],
  },
];
