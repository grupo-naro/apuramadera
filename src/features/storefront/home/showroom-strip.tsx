/**
 * Cierre de la home — invitación al showroom físico. Los datos de
 * contacto salen de `store.config.ts`; si no hay ninguno, cae a un
 * texto genérico y un CTA al catálogo.
 */
import Link from "next/link";

import { storeConfig } from "@/store.config";

export function ShowroomStrip() {
  const { contact } = storeConfig;

  const cta = contact.whatsapp
    ? {
        href: `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
          "Hola, quiero coordinar una visita al showroom.",
        )}`,
        label: "Coordinar por WhatsApp",
        external: true,
      }
    : contact.instagram
      ? {
          href: `https://instagram.com/${contact.instagram}`,
          label: "Escribinos por Instagram",
          external: true,
        }
      : contact.email
        ? {
            href: `mailto:${contact.email}`,
            label: "Escribinos",
            external: false,
          }
        : { href: "/productos", label: "Ver la colección", external: false };

  return (
    <section id="showroom" className="scroll-mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-primary-foreground/70">
          Showroom
        </span>
        <h2 className="mt-5 font-serif text-3xl tracking-tight sm:text-4xl">
          Vení a verlos en persona
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/80">
          {contact.address
            ? `Te esperamos en ${contact.address}. Coordinamos la visita con turno.`
            : "Coordinamos visitas con turno para que veas y toques cada terminación antes de comprar."}
        </p>
        <Link
          href={cta.href}
          {...(cta.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="mt-10 border-b border-primary-foreground/50 pb-1 text-xs uppercase tracking-[0.24em] transition-colors hover:border-primary-foreground"
        >
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
