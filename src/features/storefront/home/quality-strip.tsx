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
      <ul className="mx-auto grid max-w-6xl grid-cols-4 px-2 py-4 sm:px-6 sm:py-8">
        {ITEMS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex flex-col items-center gap-2 border-l border-border/70 px-1.5 text-center first:border-l-0 sm:gap-3 sm:px-4"
          >
            <Icon className="size-5 text-foreground/80 sm:size-7" strokeWidth={1.4} />
            <span className="text-[0.55rem] font-medium uppercase leading-snug tracking-[0.08em] text-foreground/80 sm:text-xs sm:tracking-[0.18em]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
