import type { Metadata } from "next";
import { CheckCircle2Icon } from "lucide-react";

import { isMercadoPagoConfigured } from "@/core/modules/payments/payments.config";
import { getPaymentConnectionStatus } from "@/core/modules/payments/payments.use-cases";
import { buttonVariants } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { DisconnectMpButton } from "@/features/admin/disconnect-mp-button";

export const metadata: Metadata = {
  title: "Configuración",
  robots: { index: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  config:
    "Mercado Pago no está configurado — faltan las credenciales de la aplicación.",
  denied: "Se canceló la conexión o Mercado Pago la rechazó.",
  state: "La sesión de conexión expiró. Probá de nuevo.",
  exchange: "No se pudo completar la conexión. Probá de nuevo.",
};

interface ConfigPageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

export default async function AdminConfigPage({
  searchParams,
}: ConfigPageProps) {
  const { connected, error } = await searchParams;
  const status = await getPaymentConnectionStatus();

  const dateLabel = status.connectedAt
    ? new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(
        status.connectedAt,
      )
    : null;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Conectá los servicios de la tienda.
        </p>
      </div>

      {connected === "1" && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          ¡Cuenta de Mercado Pago conectada!
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERROR_MESSAGES[error] ?? "Ocurrió un error con la conexión."}
        </p>
      )}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Conectá la cuenta de Mercado Pago de la tienda para cobrar los
            pedidos. El cobro va directo a esa cuenta.
          </p>

          {!isMercadoPagoConfigured ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Falta configurar las credenciales de la aplicación
              (`MP_CLIENT_ID` / `MP_CLIENT_SECRET`).
            </p>
          ) : status.connected ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="size-8 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Cuenta conectada</p>
                  <p className="text-muted-foreground">
                    ID de vendedor {status.mpUserId}
                    {dateLabel ? ` · desde el ${dateLabel}` : ""}
                  </p>
                </div>
              </div>
              <DisconnectMpButton />
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4">
              <p className="text-sm text-muted-foreground">
                Todavía no hay ninguna cuenta conectada.
              </p>
              <a
                href="/api/payments/mercadopago/connect"
                className={buttonVariants()}
              >
                Conectar con Mercado Pago
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
