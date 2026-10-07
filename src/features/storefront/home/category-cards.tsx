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

      {/* Siempre 3 columnas, una al lado de la otra (sin carrusel). En
          celular las tarjetas son angostas y altas, con el texto más chico. */}
      <div className="mt-8 grid grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted sm:aspect-square"
          >
            <Image
              src={card.src}
              alt={card.alt}
              fill
              sizes="33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-2.5 text-background max-[380px]:p-2 sm:p-5">
              <h3 className="text-[0.6rem] font-medium uppercase leading-tight tracking-[0.1em] max-[380px]:text-[0.52rem] max-[380px]:tracking-[0.04em] max-[340px]:text-[0.45rem] sm:text-sm sm:leading-snug sm:tracking-[0.24em] md:text-base">
                {card.title}
              </h3>
              <span className="mt-1 block text-[0.6rem] leading-tight text-background/90 max-[380px]:text-[0.52rem] max-[340px]:text-[0.45rem] sm:mt-1.5 sm:text-sm">
                {card.cta} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
