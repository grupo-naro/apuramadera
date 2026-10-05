"use client";

/**
 * Formulario de presupuesto a medida (React Hook Form + Zod).
 *
 * SIN backend por ahora: al enviar arma un mensaje y abre WhatsApp con
 * el detalle cargado (si hay número en `store.config.ts`), y muestra
 * una pantalla de confirmación.
 *
 * TODO(panel): persistir cada consulta en una tabla `PresupuestoMedida`
 * vía Server Action y listarlas en el panel admin — sección
 * "Presupuestos a medida", al estilo de Órdenes.
 */
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/core/ui/button";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/core/ui/textarea";
import { storeConfig } from "@/store.config";

const TIPOS = [
  "Vanitorio",
  "Bajo mesada",
  "Mueble alto / columna",
  "Estantería",
  "Espejo con marco",
  "Botiquín",
  "Otro",
] as const;

const quoteSchema = z.object({
  nombre: z.string().trim().min(2, "Contanos tu nombre."),
  telefono: z.string().trim().min(6, "Dejanos un teléfono o WhatsApp."),
  email: z
    .string()
    .trim()
    .email("Revisá el email.")
    .or(z.literal(""))
    .optional(),
  tipo: z.string().min(1, "Elegí un tipo de mueble."),
  medidas: z.string().trim().max(120).optional(),
  detalle: z
    .string()
    .trim()
    .min(10, "Contanos un poco más (mínimo 10 caracteres)."),
});

type QuoteValues = z.infer<typeof quoteSchema>;

function buildWhatsAppMessage(values: QuoteValues): string {
  return [
    "Hola, quiero un presupuesto a medida.",
    "",
    `Nombre: ${values.nombre}`,
    `Teléfono: ${values.telefono}`,
    values.email ? `Email: ${values.email}` : null,
    `Tipo: ${values.tipo}`,
    values.medidas ? `Medidas: ${values.medidas}` : null,
    "",
    values.detalle,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function QuoteForm() {
  const [sent, setSent] = useState(false);
  const whatsapp = storeConfig.contact.whatsapp;

  const form = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      nombre: "",
      telefono: "",
      email: "",
      tipo: "",
      medidas: "",
      detalle: "",
    },
  });

  function onSubmit(values: QuoteValues) {
    if (whatsapp) {
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        buildWhatsAppMessage(values),
      )}`;
      window.open(url, "_blank", "noopener");
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-sm border border-border/70 bg-secondary/40 p-8 text-center sm:p-10">
        <h2 className="font-serif text-2xl tracking-tight">
          {whatsapp ? "Te abrimos WhatsApp con tu consulta" : "Recibimos tu consulta"}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {whatsapp
            ? "Enviá el mensaje y te pasamos el presupuesto a la brevedad. Si no se abrió la app, reintentá desde el botón."
            : "Te contactamos a la brevedad con el presupuesto."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                buildWhatsAppMessage(form.getValues()),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-foreground/40 pb-1 text-xs uppercase tracking-[0.2em] transition-colors hover:border-foreground"
            >
              Abrir WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              form.reset();
              setSent(false);
            }}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cargar otra consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w-xl flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
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
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono / WhatsApp</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de mueble</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="medidas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medidas aproximadas (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ancho × Alto × Prof. en cm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="detalle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contanos qué necesitás</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Acabado, si lleva bacha, para qué baño es, referencias que te gusten…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="self-start">
          {whatsapp ? "Enviar por WhatsApp" : "Enviar consulta"}
        </Button>
      </form>
    </Form>
  );
}
