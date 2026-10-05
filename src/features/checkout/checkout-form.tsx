"use client";

/**
 * Formulario de checkout (React Hook Form + Zod).
 *
 * Valida con el MISMO schema que la Server Action (`checkoutSchema`).
 * La dirección sólo se pide si el método elegido es a domicilio. Los
 * totales del resumen son indicativos — el monto real lo recalcula el
 * servidor en `submitCheckout`.
 */
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { XIcon } from "lucide-react";

import { trackBeginCheckout } from "@/core/integrations/analytics";
import { isWhatsAppConfigured } from "@/core/integrations/whatsapp";
import { formatPrice } from "@/core/lib/format";
import type { Cart } from "@/core/modules/cart";
import {
  checkoutSchema,
  submitCheckout,
  type CheckoutChannel,
  type CheckoutInput,
} from "@/core/modules/checkout";
// Import directo (no por barrel) para no arrastrar Prisma al bundle cliente.
import { applyCouponAction } from "@/core/modules/coupons/coupons.actions";
import type { ValidatedCoupon } from "@/core/modules/coupons/coupons.types";
import { getShippingMethods } from "@/core/modules/shipping";
import { Button } from "@/core/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/ui/form";
import { Input } from "@/core/ui/input";
import { RadioGroup, RadioGroupItem } from "@/core/ui/radio-group";
import { StoreImage } from "@/core/ui/store-image";
import { Textarea } from "@/core/ui/textarea";

interface CheckoutFormProps {
  cart: Cart;
}

export function CheckoutForm({ cart }: CheckoutFormProps) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPending, startCouponTransition] = useTransition();
  const beginTrackedRef = useRef(false);

  const methods = useMemo(() => getShippingMethods(), []);

  // begin_checkout — al entrar a la página, una sola vez.
  useEffect(() => {
    if (beginTrackedRef.current) return;
    beginTrackedRef.current = true;
    trackBeginCheckout({
      value: cart.subtotal,
      items: cart.lines.map((line) => ({
        productId: line.productId,
        name: line.productName,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      })),
    });
  }, [cart]);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      customerName: "",
      phone: "",
      shippingMethodId: "",
      recipient: "",
      street: "",
      apartment: "",
      city: "",
      province: "",
      postalCode: "",
      notes: "",
      couponCode: "",
    },
  });

  const selectedMethodId = useWatch({
    control: form.control,
    name: "shippingMethodId",
  });
  const selectedMethod = methods.find((m) => m.id === selectedMethodId) ?? null;
  const isDelivery = selectedMethod?.kind === "delivery";

  const shippingCost = selectedMethod?.cost ?? 0;
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, cart.subtotal + shippingCost - couponDiscount);

  function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    startCouponTransition(async () => {
      const result = await applyCouponAction(code);
      if (!result.ok) {
        setAppliedCoupon(null);
        form.setValue("couponCode", "");
        setCouponError(result.error);
        return;
      }
      setAppliedCoupon(result.coupon);
      form.setValue("couponCode", result.coupon.code);
      setCouponInput(result.coupon.code);
    });
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput("");
    form.setValue("couponCode", "");
  }

  function onSubmit(values: CheckoutInput, event?: React.BaseSyntheticEvent) {
    setServerError(null);
    // El canal lo decide el botón que disparó el submit, vía `value`.
    const native = event?.nativeEvent;
    const submitter =
      native && "submitter" in native
        ? (native.submitter as HTMLButtonElement | null)
        : null;
    const channel: CheckoutChannel =
      submitter?.value === "whatsapp" ? "whatsapp" : "online";
    startTransition(async () => {
      const result = await submitCheckout(values, channel);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      // Canal WhatsApp: abre el chat con el detalle pre-armado y
      // deja al cliente en la página de su orden.
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener");
      }
      window.location.href = result.redirectUrl;
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start"
      >
        <div className="flex flex-col gap-8">
          {/* ─── Contacto ─────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Datos de contacto</h2>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre y apellido</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      placeholder="Opcional"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Lo usamos para coordinar la entrega.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ─── Envío ────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Método de envío</h2>
            <FormField
              control={form.control}
              name="shippingMethodId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {methods.map((method) => (
                        <label
                          key={method.id}
                          htmlFor={`ship-${method.id}`}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-checked:border-primary has-checked:bg-accent/40"
                        >
                          <RadioGroupItem
                            id={`ship-${method.id}`}
                            value={method.id}
                            className="mt-0.5"
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">
                                {method.label}
                              </span>
                              <span className="shrink-0 text-sm font-semibold tabular-nums">
                                {method.cost === 0
                                  ? "Gratis"
                                  : formatPrice(method.cost)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {method.description}
                            </span>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* ─── Dirección (sólo envío a domicilio) ───────────── */}
          {isDelivery && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Dirección de entrega</h2>
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quién recibe</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional — por defecto, vos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calle y altura</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-line1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depto / Piso</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localidad</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código postal</FormLabel>
                      <FormControl>
                        <Input autoComplete="postal-code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          )}

          {/* ─── Notas ────────────────────────────────────────── */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas del pedido</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Opcional — alguna aclaración para la entrega."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ─── Resumen ────────────────────────────────────────── */}
        <aside className="flex flex-col gap-4 rounded-lg border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Tu pedido</h2>

          {/* Cupón */}
          <div className="flex flex-col gap-2 border-b pb-4">
            <label
              htmlFor="coupon-code"
              className="text-sm font-medium text-muted-foreground"
            >
              ¿Tenés un cupón?
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                <span className="flex flex-col">
                  <span className="font-semibold text-emerald-900">
                    {appliedCoupon.code}
                  </span>
                  {appliedCoupon.description && (
                    <span className="text-xs text-emerald-800">
                      {appliedCoupon.description}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-full p-1 text-emerald-900 hover:bg-emerald-100"
                  aria-label="Quitar cupón"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="coupon-code"
                  value={couponInput}
                  onChange={(event) =>
                    setCouponInput(event.target.value.toUpperCase())
                  }
                  placeholder="Código"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={couponPending}
                  className="uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={couponPending || couponInput.trim() === ""}
                >
                  {couponPending ? "…" : "Aplicar"}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-destructive">{couponError}</p>
            )}
          </div>

          <ul className="flex flex-col divide-y">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-3 py-3 first:pt-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                  {line.imagePublicId && (
                    <StoreImage
                      src={line.imagePublicId}
                      alt={line.imageAlt ?? line.productName}
                      preset="thumbnail"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-sm font-medium leading-snug">
                    {line.productName}
                  </span>
                  {line.variantName && (
                    <span className="text-xs text-muted-foreground">
                      {line.variantName}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {line.quantity} × {formatPrice(line.unitPrice)}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPrice(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envío</span>
              <span className="tabular-nums">
                {selectedMethod
                  ? shippingCost === 0
                    ? "Gratis"
                    : formatPrice(shippingCost)
                  : "A calcular"}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Cupón · {appliedCoupon.code}
                </span>
                <span className="tabular-nums text-emerald-700">
                  -{formatPrice(appliedCoupon.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" size="lg" value="online" disabled={pending}>
            {pending ? "Procesando…" : "Confirmar pedido"}
          </Button>
          {isWhatsAppConfigured && (
            <>
              <div className="relative my-1 text-center text-xs uppercase text-muted-foreground">
                <span className="bg-card px-2">o</span>
                <span className="absolute inset-x-0 top-1/2 -z-10 border-t" />
              </div>
              <Button
                type="submit"
                size="lg"
                variant="outline"
                value="whatsapp"
                disabled={pending}
              >
                Coordinar por WhatsApp
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Te abrimos el chat con el detalle del pedido.
              </p>
            </>
          )}
        </aside>
      </form>
    </Form>
  );
}
