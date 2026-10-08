/**
 * Hero — foto de fondo (vanitory de listones con espejo redondo) y el
 * texto alineado a la izquierda sobre un degradé oscuro para que se lea.
 * Un kicker con el material, el titular "Tu vanitory / Hecho para
 * durar", las tres cualidades del mueble, el botón al catálogo y la
 * ubicación del taller.
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
        <span className="flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[0.34em] text-background/80">
          Álamo macizo
          <span aria-hidden="true" className="h-px w-10 bg-background/60" />
        </span>

        <h1 className="mt-4 max-w-xl sm:mt-5 font-serif tracking-tight">
          <span className="block text-4xl font-semibold uppercase leading-[1.02] sm:text-6xl lg:text-7xl">
            Tu vanitory
          </span>
          <span className="mt-2 block text-2xl font-normal leading-tight sm:text-5xl lg:text-6xl">
            Hecho para durar
          </span>
        </h1>

        {/* En celular se omite: la franja de íconos de abajo dice lo mismo
            y así el hero y las tarjetas siguen entrando en la primera pantalla. */}
        <ul className="mt-7 hidden gap-1 text-xs font-medium uppercase tracking-[0.2em] text-background/90 md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
          {QUALITIES.map((quality, index) => (
            <li key={quality} className="flex items-center gap-4">
              {/* Separador sólo cuando van en fila (md+): apilados no hace falta. */}
              {index > 0 && (
                <span aria-hidden="true" className="hidden text-background/50 md:inline">
                  |
                </span>
              )}
              {quality}
            </li>
          ))}
        </ul>

        <Link
          href="/productos"
          className="mt-5 inline-flex items-center gap-3 bg-background px-7 py-2.5 text-xs sm:mt-10 sm:py-4 font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-background/90"
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
