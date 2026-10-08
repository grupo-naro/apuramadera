/**
 * Hero — foto de fondo (vanitory de listones con espejo redondo) y el
 * texto alineado a la izquierda sobre un degradé oscuro para que se lea.
 * Un kicker con el material, el titular "Tu vanitory / Hecho para
 * durar" (misma altura de letra en las dos líneas: la primera en
 * semibold y la segunda en peso normal), las tres cualidades del
 * mueble, el botón al catálogo y la ubicación del taller.
 *
 * Los colores salen de los tokens del tema (`foreground` es el tono
 * oscuro de la marca y `background` el hueso), no de colores literales.
 */
import Image from "next/image";
import Link from "next/link";

const QUALITIES = ["Madera real", "100% impermeabilizada", "Apta para agua y humedad"];

export function Hero() {
  return (
    <section className="relative isolate flex items-center sm:min-h-[80vh] overflow-hidden bg-foreground text-background">
      <Image
        src="/a1.jpeg"
        alt="Vanitory de madera con frente de listones, bacha de apoyo y espejo redondo"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[50%_72%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/75 via-foreground/40 to-foreground/5"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-28 sm:pt-20">
        <span className="flex items-center gap-3 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-background/80 sm:gap-4 sm:text-[0.7rem] sm:tracking-[0.34em]">
          Álamo macizo
          <span aria-hidden="true" className="h-px w-8 bg-background/60 sm:w-10" />
        </span>

        <h1 className="mt-3 max-w-xl font-serif leading-[1.1] tracking-tight sm:mt-5 sm:leading-[1.06]">
          <span className="block text-[1.7rem] font-semibold sm:text-5xl lg:text-6xl">
            Tu vanitory
          </span>
          <span className="block text-[1.7rem] font-normal sm:text-5xl lg:text-6xl">
            Hecho para durar
          </span>
        </h1>

        {/* Celular: dos renglones (las dos primeras juntas, la tercera
            abajo). Desde md, los tres en una fila con separadores. */}
        <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-background/90 sm:mt-7 sm:text-xs sm:tracking-[0.2em] md:gap-x-4">
          {QUALITIES.map((quality, index) => (
            <li
              key={quality}
              className={`flex items-center gap-3 md:gap-4 ${index === 2 ? "basis-full md:basis-auto" : ""}`}
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`text-background/50 ${index === 2 ? "hidden md:inline" : ""}`}
                >
                  |
                </span>
              )}
              {quality}
            </li>
          ))}
        </ul>

        <Link
          href="/productos"
          className="mt-5 inline-flex items-center gap-3 bg-background px-6 py-2.5 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-background/90 sm:mt-10 sm:px-7 sm:py-4 sm:text-xs"
        >
          Ver vanitorys
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <p className="absolute inset-x-0 bottom-5 mx-auto w-full max-w-6xl px-4 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-background/75 sm:bottom-12 sm:px-6">
        Fabricantes · Showroom en Merlo
      </p>
    </section>
  );
}
