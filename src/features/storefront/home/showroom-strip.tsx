/**
 * Showroom — sección oscura con foto de fondo: dirección, WhatsApp y
 * el botón "Cómo llegar" (Google Maps), más la firma manuscrita
 * "Fábrica a la vista". Los datos salen de `store.config.ts`; si falta
 * la dirección, el botón cae al WhatsApp y, sin ninguno, al catálogo.
 */
import { MapPinIcon, MessageCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { storeConfig } from "@/store.config";

import { formatWhatsappNumber, mapsUrl } from "./showroom-info";

export function ShowroomStrip() {
  const { contact } = storeConfig;

  const whatsappHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
        "Hola, quiero coordinar una visita al showroom.",
      )}`
    : null;

  const cta = contact.address
    ? { href: mapsUrl(contact.address), label: "Cómo llegar", external: true }
    : whatsappHref
      ? { href: whatsappHref, label: "Coordinar por WhatsApp", external: true }
      : { href: "/productos", label: "Ver la colección", external: false };

  return (
    <section
      id="showroom"
      className="relative isolate scroll-mt-24 overflow-hidden bg-foreground text-background"
    >
      <Image
        src="/hero.png"
        alt="Showroom de A Pura Madera: estantes con bachas de apoyo y espejos"
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[70%_50%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground via-foreground/85 to-foreground/30"
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-24">
        <div className="max-w-[16rem] sm:max-w-md">
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-background/70 sm:text-[0.7rem]">
            Showroom
          </span>
          <h2 className="mt-2 font-serif text-2xl leading-tight tracking-tight sm:mt-4 sm:text-4xl">
            Te esperamos en Merlo
          </h2>

          <ul className="mt-4 flex flex-col gap-2 text-xs text-background/90 sm:mt-6 sm:gap-3 sm:text-sm">
            {contact.address && (
              <li className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                {contact.address}
              </li>
            )}
            {whatsappHref && contact.whatsapp && (
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-background"
                >
                  <MessageCircleIcon className="size-4 shrink-0" />
                  {formatWhatsappNumber(contact.whatsapp)}
                </a>
              </li>
            )}
          </ul>

          <Link
            href={cta.href}
            {...(cta.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="mt-5 inline-flex items-center gap-2 border border-background/60 px-4 py-2.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] transition-colors hover:bg-background hover:text-foreground sm:mt-8 sm:px-6 sm:py-3 sm:text-xs"
          >
            {cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-3 right-4 -rotate-6 font-script text-2xl text-background/90 sm:bottom-10 sm:right-16 sm:text-5xl">
        Fábrica a la vista
      </p>
    </section>
  );
}
