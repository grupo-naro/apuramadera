// scripts/generate-icons.mjs
// Genera los íconos de la app (favicon + apple-touch) a partir del logo.
// Uso: node scripts/generate-icons.mjs
import sharp from "sharp";

const SOURCE = "public/logo.png";

/** Recorta el margen blanco del logo y lo centra en un cuadrado blanco. */
async function makeIcon(size, output, padding) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(SOURCE)
    .trim({ threshold: 10 })
    .resize(inner, inner, { fit: "inside" })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(output);
}

await makeIcon(512, "src/app/icon.png", 0.06);
await makeIcon(180, "src/app/apple-icon.png", 0.1);
console.log("Íconos generados: src/app/icon.png, src/app/apple-icon.png");
