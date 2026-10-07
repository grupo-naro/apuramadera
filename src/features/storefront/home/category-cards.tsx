/**
 * "Diseñados para tu baño" — tres tarjetas con foto (vanitorys,
 * espejos, tolvas organizadoras) que llevan al catálogo. Las fotos
 * salen de `public/`: se cambian reemplazando el archivo.
 */
import Image from "next/image";
import Link from "next/link";

interface CategoryCard {
  src: string;
  alt: string;
  title: string;
  cta: string;
  href: string;
}

const CARDS: CategoryCard[] = [
  {
    src: "/a1.jpeg",
    alt: "Vanitory de madera con frente de listones",
    title: "Vanitorys",
    cta: "Ver modelos",
    href: "/productos",
  },
  {
    src: "/a3.jpeg",
    alt: "Espejo redondo de marco negro sobre un vanitory de madera",
    title: "Espejos",
    cta: "Ver modelos",
    href: "/productos",
  },
  {
    // Foto provisoria: organizador de madera con estantes en la pared.
    src: "/a6.jpeg",
    alt: "Organizador de madera con estantes colgado en la pared del baño",
    title: "Tolvas organizadoras",
    cta: "Ver modelos",
    href: "/productos",
  },
];

export function CategoryCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-28">
      <div className="text-center">
        <h2 className="text-xs font-medium uppercase tracking-[0.34em] sm:text-sm">
          Diseñados para tu baño
        </h2>
        <span aria-hidden="true" className="mx-auto mt-5 block h-px w-12 bg-border" />
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Vanitorys en madera maciza, fabricados por nosotros. Elegí una medida
          estándar o diseñamos el mueble que necesitás.
        </p>
      </div>

      {/* Celular: las 3 tarjetas apiladas, sin carrusel. `sm` en adelante: 3 columnas. */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative aspect-[4/3] overflow-hidden rounded-sm bg-muted sm:aspect-square"
          >
            <Image
              src={card.src}
              alt={card.alt}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 text-background">
              <h3 className="text-sm font-medium uppercase leading-snug tracking-[0.24em] md:text-base">
                {card.title}
              </h3>
              <span className="mt-1.5 block text-sm text-background/90">
                {card.cta} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
