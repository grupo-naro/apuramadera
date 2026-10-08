/**
 * Franja de cualidades bajo el hero: cuatro íconos con su leyenda,
 * separados por líneas finas. Siempre en 4 columnas (también en celular).
 */
import {
  DropletIcon,
  FactoryIcon,
  LeafIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";

const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: LeafIcon, label: "Madera real" },
  { icon: DropletIcon, label: "100% impermeabilizada" },
  { icon: ShieldCheckIcon, label: "Apta para agua y humedad" },
  { icon: FactoryIcon, label: "Somos fabricantes" },
];

export function QualityStrip() {
  return (
    <section className="border-b border-border/70 bg-secondary/40">
      {/* Celular: columnas de ancho proporcional al texto (la de
          "100% impermeabilizada" es la más ancha) para poder usar letra
          chica sin cortar palabras y dejar aire entre las cuatro. Desde
          `sm`, cuatro columnas iguales. */}
      <ul className="mx-auto grid max-w-6xl grid-cols-[0.8fr_1.35fr_1.2fr_1fr] px-3 py-4 sm:grid-cols-4 sm:px-6 sm:py-8">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex flex-col items-center gap-1.5 border-l border-border/70 px-2 text-center first:border-l-0 max-[340px]:px-1 sm:gap-3 sm:px-4"
          >
            <Icon className="size-4 text-foreground/70 sm:size-7 sm:text-foreground/80" strokeWidth={1.4} />
            <span className="text-balance text-[0.5rem] font-medium uppercase leading-[1.35] tracking-[0.06em] text-foreground/80 max-[380px]:text-[0.47rem] max-[340px]:text-[0.44rem] sm:text-xs sm:leading-snug sm:tracking-[0.18em]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
