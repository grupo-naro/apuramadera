"use client";

/**
 * Formulario de cupón del panel admin (React Hook Form + Zod).
 *
 * Todos los campos viajan como string — la action castea a centavos /
 * Date / Int. El label y prefijo del input "Valor" cambian según el
 * tipo (porcentaje vs monto fijo).
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { saveCouponAction } from "@/core/modules/coupons/coupons.actions";
import {
  couponFormSchema,
  type CouponFormInput,
} from "@/core/modules/coupons/coupons.schemas";
import { Button, buttonVariants } from "@/core/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Switch } from "@/core/ui/switch";
import { Textarea } from "@/core/ui/textarea";

const EMPTY_VALUES: CouponFormInput = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  description: "",
  isActive: true,
  startsAt: "",
  endsAt: "",
  minSubtotal: "",
  usageLimit: "",
};

export interface CouponFormProps {
  couponId?: string;
  defaultValues?: CouponFormInput;
}

export function CouponForm({ couponId, defaultValues }: CouponFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CouponFormInput>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  const type = useWatch({ control: form.control, name: "type" });
  const isPercentage = type === "PERCENTAGE";

  function onSubmit(values: CouponFormInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveCouponAction(couponId ?? null, values);
      if (result.ok) {
        router.push("/admin/cupones");
        return;
      }
      setServerError(result.error);
      if (result.field === "code") {
        form.setError("code", { message: result.error });
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w-xl flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Datos del cupón</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VERANO25"
                      autoCapitalize="characters"
                      spellCheck={false}
                      className="uppercase"
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Lo tipea el cliente al finalizar la compra. Sólo letras,
                    números, `_` y `-`.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">
                          Monto fijo (en pesos)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isPercentage ? "Porcentaje" : "Monto"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        {!isPercentage && (
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                            $
                          </span>
                        )}
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={isPercentage ? 1 : 1}
                          max={isPercentage ? 100 : undefined}
                          step={1}
                          className={isPercentage ? "" : "pl-7"}
                          {...field}
                        />
                        {isPercentage && (
                          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                            %
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {isPercentage
                        ? "Entre 1 y 100."
                        : "Monto fijo a descontar, en pesos."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Opcional — se muestra al cliente al aplicar."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reglas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="minSubtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtotal mínimo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={1}
                        placeholder="Sin mínimo"
                        className="pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Subtotal mínimo en pesos para que aplique. Dejá vacío si no
                    aplica.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cupo máximo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="Ilimitado"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Cantidad total de veces que se puede usar el cupón. Vacío =
                    sin límite.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido desde</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido hasta</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activo</FormLabel>
                  <FormControl>
                    <div className="flex h-9 items-center">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Los cupones inactivos no se pueden aplicar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar cupón"}
          </Button>
          <Link
            href="/admin/cupones"
            className={buttonVariants({ variant: "ghost" })}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}
