/**
 * Sección "a medida" de la home — deliberadamente discreta: lo
 * principal es el catálogo. Sólo deja la puerta abierta a pedir un
 * mueble fuera de catálogo.
 */
import Link from "next/link";

export function CustomFurniture() {
  return (
    <section className="border-t border-border/70 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-16 text-center sm:px-6 sm:py-20 md:flex-row md:items-center md:justify-between md:gap-10 md:text-left">
        <div>
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            A medida
          </span>
          <h2 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">
            ¿Buscás algo que no está en el catálogo?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:mx-0">
            Fabricamos muebles de baño en álamo macizo con tus medidas y
            terminación.
          </p>
        </div>
        <Link
          href="/muebles-a-medida"
          className="shrink-0 self-center border-b border-foreground/40 pb-1 text-xs uppercase tracking-[0.2em] transition-colors hover:border-foreground"
        >
          Pedir presupuesto
        </Link>
      </div>
    </section>
  );
}
