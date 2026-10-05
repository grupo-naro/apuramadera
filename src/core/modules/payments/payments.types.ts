/**
 * Tipos de dominio del módulo de pagos.
 */

/** Conexión de pago con sus tokens en claro — uso server-side. */
export interface PaymentConnection {
  mpUserId: string;
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  expiresAt: Date;
  connectedAt: Date;
}

/** Estado de la conexión — seguro de exponer a la UI (sin tokens). */
export interface PaymentConnectionStatus {
  connected: boolean;
  mpUserId?: string;
  connectedAt?: Date;
}
