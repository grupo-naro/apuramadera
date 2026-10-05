/** Footer del storefront. Marca + navegación + datos de contacto. */
import Link from "next/link";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { InstagramIcon } from "@/features/storefront/instagram-icon";
import { storeConfig } from "@/store.config";

export function Footer() {
  const { name, tagline, contact } = storeConfig;
  const hasContact =
    contact.email ||
    contact.phone ||
    contact.address ||
    contact.instagram ||
    contact.facebook;

  return (
    <footer className="mt-24 border-t border-border/70 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-xs">
          <p className="font-serif text-2xl tracking-tight">{name}</p>
          <p className="mt-3 text-sm text-muted-foreground">{tagline}.</p>
          {contact.address && (
            <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-foreground">
                  Showroom
                </span>
                {contact.address}
              </span>
            </p>
          )}
        </div>

        <nav className="flex flex-col gap-3 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">
            Tienda
          </span>
          <Link
            href="/productos"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Todo el catálogo
          </Link>
          <Link
            href="/muebles-a-medida"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Muebles a medida
          </Link>
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Inicio
          </Link>
        </nav>

        {hasContact && (
          <div className="flex flex-col gap-3 text-sm">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">
              Contacto
            </span>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <MailIcon className="size-4" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <PhoneIcon className="size-4" />
                {contact.phone}
              </a>
            )}
            {contact.instagram && (
              <a
                href={`https://instagram.com/${contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <InstagramIcon className="size-4" />@{contact.instagram}
              </a>
            )}
            {contact.facebook && (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Facebook
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border/70">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {name}. Álamo macizo, hecho en Argentina.
        </p>
      </div>
    </footer>
  );
}
