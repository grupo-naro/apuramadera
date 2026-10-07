/**
 * "Diseñados para tu baño" — tres tarjetas con foto (vanitorys,
 * espejos, a medida) que llevan al catálogo o al pedido a medida.
 * Las fotos salen de `public/`: se cambian reemplazando el archivo.
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
    src: "/a6.jpeg",
    alt: "Espejo redondo con marco fino sobre un vanitory de madera",
    title: "Espejos",
    cta: "Ver modelos",
    href: "/productos",
  },
  {
    src: "/a4.jpeg",
    alt: "Vanitory de madera con cajones",
    title: "A medida",
    cta: "Contanos tu proyecto",
    href: "/muebles-a-medida",
  },
];

export function CategoryCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
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

      {/* Mobile: tira horizontal con scroll-snap. `md` en adelante: 3 columnas. */}
      <div className="-mx-4 mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative aspect-square w-[72vw] shrink-0 snap-start overflow-hidden rounded-sm bg-muted sm:w-[44vw] md:w-auto"
          >
            <Image
              src={card.src}
              alt={card.alt}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 44vw, 72vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 text-background">
              <h3 className="text-sm font-medium uppercase tracking-[0.28em] sm:text-base">
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
