/**
 * Hero — foto de fondo (vanitory de madera clara con cajones y espejo redondo) y el
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
    <section className="relative isolate flex min-h-[58vh] items-center sm:min-h-[80vh] overflow-hidden bg-foreground text-background">
      <Image
        src="/a4.jpeg"
        alt="Vanitory de madera clara con cajones, espejo redondo y ducha"
        fill
        priority
        sizes="100vw"
        // scale-110 + origin-top recorta ~10% de abajo: a4.jpeg trae una marca
        // de agua (estrella) en la esquina inferior derecha.
        className="-z-20 origin-top scale-110 object-cover object-[50%_66%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/75 via-foreground/40 to-foreground/5"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
        <span className="flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[0.34em] text-background/80">
          Álamo macizo
          <span aria-hidden="true" className="h-px w-10 bg-background/60" />
        </span>

        <h1 className="mt-5 max-w-xl font-serif tracking-tight">
          <span className="block text-4xl font-semibold uppercase leading-[1.02] sm:text-6xl lg:text-7xl">
            Tu vanitory
          </span>
          <span className="mt-2 block text-2xl font-normal leading-tight sm:text-5xl lg:text-6xl">
            Hecho para durar
          </span>
        </h1>

        <ul className="mt-7 flex flex-col gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-background/90 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:text-xs">
          {QUALITIES.map((quality, index) => (
            <li key={quality} className="flex items-center gap-4">
              {/* Separador sólo en fila (sm+): apilado en celular no hace falta. */}
              {index > 0 && (
                <span aria-hidden="true" className="hidden text-background/50 sm:inline">
                  |
                </span>
              )}
              {quality}
            </li>
          ))}
        </ul>

        <Link
          href="/productos"
          className="mt-10 inline-flex items-center gap-3 bg-background px-7 py-4 text-xs font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-background/90"
        >
          Ver vanitorys
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <p className="absolute inset-x-0 bottom-10 mx-auto w-full max-w-6xl px-4 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-background/75 sm:bottom-12 sm:px-6">
        Fabricantes · Showroom en Merlo
      </p>
    </section>
  );
}
