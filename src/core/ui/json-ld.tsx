/**
 * Renderiza un objeto como `<script type="application/ld+json">`.
 *
 * Escapa `<` para evitar inyección de HTML/XSS dentro del JSON.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
