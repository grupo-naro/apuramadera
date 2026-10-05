/**
 * Use cases del módulo de pagos — gestión de la conexión con
 * Mercado Pago.
 *
 * El access token de MP vence a las ~6 h; `getValidAccessToken` lo
 * renueva con el refresh token de forma transparente.
 */
import type { MpTokenResponse } from "./mercadopago";
import { createPreference, getPayment, refreshAccessToken } from "./mercadopago";
import { MP_WEBHOOK_URL, SITE_URL } from "./payments.config";
import {
  deleteConnection,
  findConnection,
  saveConnection,
  type SaveConnectionData,
} from "./payments.repository";
import type { PaymentConnectionStatus } from "./payments.types";

/** Margen antes del vencimiento para renovar el token (5 minutos). */
const REFRESH_MARGIN_MS = 5 * 60_000;

/** Mapea la respuesta de tokens de MP al shape que persiste el repo. */
function toSaveData(token: MpTokenResponse): SaveConnectionData {
  return {
    mpUserId: String(token.user_id),
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    publicKey: token.public_key,
    scope: token.scope ?? null,
    expiresAt: new Date(Date.now() + token.expires_in * 1000),
  };
}

/** Persiste una conexión a partir de la respuesta OAuth de MP. */
export async function storeConnection(token: MpTokenResponse): Promise<void> {
  await saveConnection(toSaveData(token));
}

/** Estado de la conexión — sin tokens, seguro para la UI. */
export async function getPaymentConnectionStatus(): Promise<PaymentConnectionStatus> {
  const connection = await findConnection();
  if (!connection) return { connected: false };
  return {
    connected: true,
    mpUserId: connection.mpUserId,
    connectedAt: connection.connectedAt,
  };
}

/**
 * Devuelve un access token válido. Si está vencido o por vencer, lo
 * renueva con el refresh token y persiste el nuevo. Lanza si la
 * tienda no tiene Mercado Pago conectado.
 */
export async function getValidAccessToken(): Promise<string> {
  const connection = await findConnection();
  if (!connection) {
    throw new Error("Mercado Pago no está conectado.");
  }

  const msToExpiry = connection.expiresAt.getTime() - Date.now();
  if (msToExpiry > REFRESH_MARGIN_MS) {
    return connection.accessToken;
  }

  const refreshed = await refreshAccessToken(connection.refreshToken);
  await saveConnection(toSaveData(refreshed));
  return refreshed.access_token;
}

/** Desvincula la cuenta de Mercado Pago. */
export async function disconnectPayment(): Promise<void> {
  await deleteConnection();
}

// ─── Checkout Pro ──────────────────────────────────────────────

/** Ítem de la preferencia — precio unitario en CENTAVOS. */
export interface PreferenceItemInput {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePreferenceInput {
  orderId: string;
  /** N° legible de la orden — usado si hay que colapsar a un ítem único. */
  orderNumber: number;
  items: PreferenceItemInput[];
  /** Costo de envío en centavos — se agrega como un ítem extra. */
  shippingCost: number;
  /** Descuento por cupón en centavos. 0 si no aplica. */
  couponDiscount: number;
  payerEmail: string;
}

/**
 * Crea una preferencia de Checkout Pro para una orden. Devuelve el
 * `initPoint` — la URL de Mercado Pago a la que se manda al cliente.
 *
 * Mercado Pago calcula el total como `sum(items.unit_price * qty)`, y
 * la API NO acepta unit_price negativo. Cuando hay descuento de cupón,
 * colapsamos los ítems a uno solo ("Pedido #N") con el monto ya
 * descontado, así el total en el checkout de MP coincide con el de la
 * tienda. Sin cupón, mantenemos el detalle de cada ítem.
 */
export async function createPaymentPreference(
  input: CreatePreferenceInput,
): Promise<{ initPoint: string; preferenceId: string }> {
  const accessToken = await getValidAccessToken();

  // Centavos → pesos (Mercado Pago trabaja en la unidad mayor).
  const itemsSubtotal = input.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const itemsAfterDiscount = Math.max(0, itemsSubtotal - input.couponDiscount);

  const items =
    input.couponDiscount > 0
      ? [
          {
            title: `Pedido #${input.orderNumber} (con descuento aplicado)`,
            quantity: 1,
            unit_price: itemsAfterDiscount / 100,
            currency_id: "ARS",
          },
        ]
      : input.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice / 100,
          currency_id: "ARS",
        }));
  if (input.shippingCost > 0) {
    items.push({
      title: "Envío",
      quantity: 1,
      unit_price: input.shippingCost / 100,
      currency_id: "ARS",
    });
  }

  const orderUrl = `${SITE_URL}/orden/${input.orderId}`;
  const preference = await createPreference(accessToken, {
    items,
    payer: { email: input.payerEmail },
    // Mapea el pago de vuelta a la orden en el webhook.
    external_reference: input.orderId,
    back_urls: { success: orderUrl, failure: orderUrl, pending: orderUrl },
    auto_return: "approved",
    notification_url: MP_WEBHOOK_URL,
  });

  return { initPoint: preference.init_point, preferenceId: preference.id };
}

export interface PaymentInfo {
  paymentId: string;
  status: string;
  /** `external_reference` — el id de la orden. */
  orderId: string | null;
}

/** Consulta el estado de un pago en Mercado Pago. */
export async function fetchPaymentInfo(
  paymentId: string,
): Promise<PaymentInfo> {
  const accessToken = await getValidAccessToken();
  const payment = await getPayment(accessToken, paymentId);
  return {
    paymentId: String(payment.id),
    status: payment.status,
    orderId: payment.external_reference,
  };
}
