/**
 * Configuración de la tienda — UNA fila para clonar el framework.
 *
 * Cambiar este archivo + las env vars es lo que diferencia una tienda
 * de otra:
 *  · `name`/`tagline`/`description`: cómo se llama y vende.
 *  · `contact`: emails/teléfonos/redes que aparecen en el footer.
 *  · `theme`: tokens oklch (light/dark) inyectados como CSS vars desde
 *    el layout — los componentes consumen `bg-background`/`text-primary`
 *    etc. y nunca valores literales, así cambiar la identidad es sólo
 *    editar este archivo.
 *
 * Pensado para que un clonado sea: copiar repo → editar este archivo
 * + las env vars del cliente → desplegar.
 */

export interface StoreContact {
  /** Dirección de mail visible para el cliente. */
  email?: string;
  /** Teléfono visible en footer/contacto. */
  phone?: string;
  /**
   * WhatsApp en formato internacional, sólo dígitos (sin `+`, espacios
   * ni guiones). Ej.: `5491144457240`. Lo usan los CTA del storefront.
   * El botón flotante y el checkout usan `NEXT_PUBLIC_WHATSAPP_PHONE`
   * aparte.
   */
  whatsapp?: string;
  /** Dirección física, una línea. */
  address?: string;
  /** Handle de Instagram sin `@`. */
  instagram?: string;
  /** URL completa de la página de Facebook. */
  facebook?: string;
}

/**
 * Set de tokens shadcn — valores oklch (lo que entiende globals.css).
 * El layout los lee de acá y los emite como `:root { --primary: ... }`.
 */
export interface StoreThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface StoreTheme {
  light: StoreThemeTokens;
  dark: StoreThemeTokens;
  /** Radio base — se propaga a sm/md/lg/xl en @theme inline. */
  radius: string;
}

export interface StoreConfig {
  /** Nombre completo — title, OG, footer. */
  name: string;
  /** Variante corta para sidebars del admin. */
  shortName: string;
  /** Frase comercial que se usa en home + metadata. */
  tagline: string;
  /** Descripción larga (meta description + OG). */
  description: string;
  /** Locale del sitio (afecta OG y formato de moneda). */
  locale: string;
  contact: StoreContact;
  theme: StoreTheme;
  /**
   * Barra de anuncio sobre el header (ofertas, envíos, etc.).
   * `undefined` ⇒ no se muestra.
   */
  announcement?: {
    text: string;
    /** Link opcional — si está, toda la barra es clickeable. */
    href?: string;
  };
}

// ─── Tema "A Pura Madera" ─────────────────────────────────────
// Paleta "galería": hueso cálido, tinta cálida casi negra, piedra
// greige y negro mate para las acciones. La calidez de la madera la
// aportan las FOTOS, no los rellenos de UI. Tienda light-only: el
// modo oscuro apunta a la misma paleta (ver `theme.dark`).

const APURA_PALETTE: StoreThemeTokens = {
  background: "oklch(0.985 0.006 85)", // hueso cálido
  foreground: "oklch(0.205 0.006 60)", // tinta cálida
  card: "oklch(0.995 0.004 85)",
  cardForeground: "oklch(0.205 0.006 60)",
  popover: "oklch(0.995 0.004 85)",
  popoverForeground: "oklch(0.205 0.006 60)",
  primary: "oklch(0.24 0.008 55)", // negro mate cálido
  primaryForeground: "oklch(0.97 0.006 85)",
  secondary: "oklch(0.94 0.006 80)", // piedra suave
  secondaryForeground: "oklch(0.3 0.008 60)",
  muted: "oklch(0.93 0.006 78)", // greige
  mutedForeground: "oklch(0.5 0.012 65)",
  accent: "oklch(0.91 0.01 75)", // piedra más profunda (hover)
  accentForeground: "oklch(0.24 0.008 55)",
  destructive: "oklch(0.52 0.13 33)", // terracota apagada
  destructiveForeground: "oklch(0.98 0.006 85)",
  border: "oklch(0.9 0.008 75)", // hairline gris cálido
  input: "oklch(0.9 0.008 75)",
  ring: "oklch(0.62 0.045 65)", // topo cálido
};

export const storeConfig: StoreConfig = {
  name: "A Pura Madera",
  shortName: "APM",
  tagline: "Muebles de baño en álamo macizo",
  description:
    "Vanitorios, bachas y espejos en álamo macizo, con terminación artesanal. Diseño sobrio, madera noble y showroom físico.",
  locale: "es_AR",
  contact: {
    instagram: "apura.madera",
    whatsapp: "5491144457240",
    // Completar con el resto de los datos reales de la tienda:
    // email: "hola@apuramadera.com",
    // phone: "+54 11 0000-0000",
     address: "Av. Rivadavia 24880, Merlo, Buenos Aires",
    // facebook: "https://facebook.com/apuramadera",
  },
  announcement: {
    // Editá o borrá esta línea para cambiar / ocultar la barra.
    text: "Hasta 15% OFF en vanitorios y espejos",
    href: "/productos",
  },
  theme: {
    light: APURA_PALETTE,
    // Light-only: sin tokens oscuros propios. Apuntar a la misma
    // paleta evita un estado sin estilar si apareciera `.dark`.
    dark: APURA_PALETTE,
    radius: "0.25rem",
  },
};
