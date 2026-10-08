/**
 * "Calidad artesanal en cada detalle" — foto a la izquierda y texto a
 * la derecha (lado a lado también en celular). El botón lleva a la
 * página "Sobre nosotros".
 */
import Image from "next/image";
import Link from "next/link";

export function CraftQuality() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-24">
      <div className="grid grid-cols-[2fr_3fr] items-center gap-4 sm:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted sm:aspect-[4/3]">
          <Image
            src="/a2.jpeg"
            alt="Vanitory de madera con frente de listones y bacha negra de apoyo"
            fill
            sizes="(min-width: 640px) 40vw, 40vw"
            className="object-cover object-[30%_70%]"
          />
        </div>

        <div>
          <span className="flex items-center gap-3 text-[0.55rem] font-medium uppercase tracking-[0.24em] text-muted-foreground sm:text-[0.7rem] sm:tracking-[0.28em]">
            Apura Madera
            <span aria-hidden="true" className="h-px w-8 bg-border sm:w-12" />
          </span>
          <h2 className="mt-2 font-serif text-xl leading-tight tracking-tight sm:mt-4 sm:text-4xl">
            Calidad artesanal en cada detalle.
          </h2>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground sm:mt-5 sm:max-w-md sm:text-sm">
            Somos fabricantes de muebles de baño en madera maciza. Diseños
            únicos, resistentes, funcionales y pensados para durar.
          </p>
          <Link
            href="/sobre-nosotros"
            className="mt-4 inline-flex items-center gap-2 border border-foreground/40 px-3 py-2 text-[0.55rem] font-medium uppercase tracking-[0.18em] transition-colors hover:border-foreground sm:mt-8 sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.22em]"
          >
            Sobre nosotros
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
