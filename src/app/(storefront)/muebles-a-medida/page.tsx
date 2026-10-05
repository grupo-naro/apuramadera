import type { Metadata } from "next";

import { QuoteForm } from "@/features/muebles-a-medida/quote-form";

export const metadata: Metadata = {
  title: "Muebles a medida",
  description:
    "Pedí un presupuesto para muebles de baño a medida en álamo macizo: piezas fuera del catálogo, con tus medidas y terminación.",
  alternates: { canonical: "/muebles-a-medida" },
};

const STEPS = [
  { n: "1", title: "Contanos", copy: "Tipo de mueble, medidas y detalle." },
  { n: "2", title: "Presupuesto", copy: "Te respondemos con precio y plazo." },
  { n: "3", title: "Taller", copy: "Lo fabricamos y coordinamos la entrega." },
];

export default function MueblesAMedidaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          A medida
        </span>
        <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
          Muebles de baño a medida
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          ¿Necesitás una pieza que no está en el catálogo? Fabricamos vanitorios,
          bajo mesadas y muebles de baño en álamo macizo con tus medidas y
          terminación. Contanos qué buscás y te pasamos un presupuesto.
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
        <QuoteForm />

        <aside className="lg:pt-1">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em]">
            Cómo funciona
          </h2>
          <ol className="mt-5 flex flex-col gap-5">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-3 text-sm">
                <span className="font-serif text-lg leading-none text-muted-foreground">
                  {step.n}
                </span>
                <span>
                  <span className="block font-medium">{step.title}</span>
                  <span className="text-muted-foreground">{step.copy}</span>
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
