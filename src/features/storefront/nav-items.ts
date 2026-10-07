/**
 * Links del menú del header: las primeras categorías de la tienda y
 * los accesos fijos (A medida, Showroom, Contacto).
 *
 * `Showroom` apunta a la sección de la home y `Contacto` al pie de la
 * página (que existe en todas las páginas), así que no hacen falta
 * páginas propias.
 */
export interface NavItem {
  label: string;
  href: string;
}

/** Cuántas categorías se muestran en el menú. */
export const MAX_NAV_CATEGORIES = 2;

const FIXED_ITEMS: NavItem[] = [
  { label: "A medida", href: "/muebles-a-medida" },
  { label: "Showroom", href: "/#showroom" },
  { label: "Contacto", href: "#contacto" },
];

export function buildNavItems(
  categories: ReadonlyArray<{ name: string; slug: string }>,
): NavItem[] {
  return [
    ...categories.slice(0, MAX_NAV_CATEGORIES).map((category) => ({
      label: category.name,
      href: `/productos?category=${category.slug}`,
    })),
    ...FIXED_ITEMS,
  ];
}
