/**
 * Hero — sólo tipografía sobre el hueso, centrado en el viewport
 * (sin llegar a pantalla completa). Un kicker con el material y el
 * titular; la historia larga del álamo se descubre al scrollear, en
 * el manifiesto de abajo. El "mouse" animado abajo refuerza que hay
 * que seguir bajando.
 */
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[75vh] items-center justify-center bg-background px-4 py-20 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.34em] text-muted-foreground">
          Álamo macizo
        </span>
        <h1 className="mt-4 font-serif text-4xl leading-[1.06] tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Muebles de baño
        </h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Diseño sobrio, terminación artesanal y un showroom físico donde ver y
          tocar cada pieza.
        </p>
        <Link
          href="/productos"
          className="mt-10 border-b border-foreground/40 pb-1 text-xs uppercase tracking-[0.24em] transition-colors hover:border-foreground"
        >
          Ver catálogo
        </Link>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2"
      >
        <span className="text-[0.55rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Scroll
        </span>
        <span className="flex h-8 w-5 items-start justify-center rounded-full border border-muted-foreground/40 pt-1.5">
          <span className="h-1.5 w-1 rounded-full bg-muted-foreground/70 animate-[am-scroll-hint_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
        </span>
      </div>
    </section>
  );
}
