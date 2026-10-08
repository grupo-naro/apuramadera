import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Somos fabricantes de muebles de baño en álamo macizo. Diseños únicos, resistentes, funcionales y pensados para durar.",
  alternates: { canonical: "/sobre-nosotros" },
};

export default function SobreNosotrosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Sobre nosotros
        </span>
        <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-5xl">
          Calidad artesanal en cada detalle.
        </h1>
      </div>

      <div className="mt-12 grid items-start gap-10 md:grid-cols-2 md:gap-14">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted">
          <Image
            src="/a2.jpeg"
            alt="Vanitory de madera con frente de listones y bacha negra de apoyo"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-[30%_70%]"
          />
        </div>

        <div className="flex flex-col gap-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p className="font-serif text-xl leading-relaxed tracking-tight text-foreground sm:text-2xl">
            Somos fabricantes de muebles de baño en madera maciza. Diseños
            únicos, resistentes, funcionales y pensados para durar.
          </p>
          <p>
            Trabajamos una sola madera: álamo macizo. Liviana, noble y estable,
            se lleva bien con la humedad del baño y envejece con carácter.
          </p>
          <p>
            Cada mueble se termina a mano en el taller —sin chapas ni
            aglomerados— para que dure décadas. Lo que ves en el showroom es lo
            que llega a tu casa.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4 text-xs uppercase tracking-[0.2em] text-foreground">
            <Link
              href="/productos"
              className="border-b border-foreground/40 pb-1 transition-colors hover:border-foreground"
            >
              Ver vanitorys
            </Link>
            <Link
              href="/#showroom"
              className="border-b border-foreground/40 pb-1 transition-colors hover:border-foreground"
            >
              Visitar el showroom
            </Link>
            <Link
              href="/muebles-a-medida"
              className="border-b border-foreground/40 pb-1 transition-colors hover:border-foreground"
            >
              Pedir uno a medida
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
