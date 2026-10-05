/** Declaración de marca — el material y el taller, sin adornos. */
export function Manifesto() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center sm:py-32">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
        El material
      </span>
      <p className="mt-6 font-serif text-2xl leading-relaxed tracking-tight text-pretty sm:text-3xl">
        Trabajamos una sola madera: álamo macizo. Liviana, noble y estable, se
        lleva bien con la humedad del baño y envejece con carácter.
      </p>
      <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Cada mueble se termina a mano en el taller —sin chapas ni aglomerados—
        para que dure décadas. Lo que ves en el showroom es lo que llega a tu
        casa.
      </p>
    </section>
  );
}
