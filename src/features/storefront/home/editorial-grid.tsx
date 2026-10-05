/**
 * Bloques editoriales — fotos de `public/` (a1–a7) con una bajada
 * corta. Todo apunta al catálogo; es un lookbook, no una grilla de
 * producto.
 */
import Image from "next/image";
import Link from "next/link";

interface Feature {
  src: string;
  eyebrow: string;
  title: string;
  copy: string;
  reverse?: boolean;
}

const FEATURES: Feature[] = [
  {
    src: "/a1.jpeg",
    eyebrow: "Vanitorios",
    title: "Suspendidos, con lugar para todo",
    copy: "Frentes de listones en álamo macizo y estante abierto. Livianos a la vista, pensados para baños chicos y grandes.",
  },
  {
    src: "/a4.jpeg",
    eyebrow: "Bachas y grifería",
    title: "Piezas que combinan con la madera",
    copy: "Bachas de apoyo en cerámica y piedra, grifería en negro mate. Elegís la combinación al comprar.",
    reverse: true,
  },
  {
    src: "/a6.jpeg",
    eyebrow: "Espejos y estantería",
    title: "El detalle que ordena el baño",
    copy: "Espejos redondos de marco fino y módulos abiertos a juego con cada vanitorio.",
  },
];

const GALLERY = ["/a2.jpeg", "/a3.jpeg", "/a5.jpeg", "/a7.jpeg"];

function FeatureRow({ src, eyebrow, title, copy, reverse }: Feature) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-sm border border-border/70 bg-muted ${
          reverse ? "md:order-2" : ""
        }`}
      >
        <Image
          src={src}
          alt={title}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className={reverse ? "md:order-1" : ""}>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {eyebrow}
        </span>
        <h3 className="mt-3 font-serif text-2xl tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {copy}
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-block border-b border-foreground/40 pb-0.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-foreground"
        >
          Ver en el catálogo
        </Link>
      </div>
    </div>
  );
}

export function EditorialGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="flex flex-col gap-20 sm:gap-28">
        {FEATURES.map((feature) => (
          <FeatureRow key={feature.src} {...feature} />
        ))}
      </div>

      {/* Mobile / tablet: strip horizontal con scroll-snap. `md` en
          adelante: grilla de 4. */}
      <div className="-mx-4 mt-20 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 no-scrollbar sm:-mx-6 sm:mt-28 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {GALLERY.map((src) => (
          <Link
            key={src}
            href="/productos"
            className="group relative aspect-square w-[60vw] shrink-0 snap-start overflow-hidden rounded-sm border border-border/70 bg-muted sm:w-[40vw] md:w-auto"
          >
            <Image
              src={src}
              alt="Ambiente de baño con muebles de A Pura Madera"
              fill
              sizes="(min-width: 768px) 25vw, (min-width: 640px) 40vw, 60vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
