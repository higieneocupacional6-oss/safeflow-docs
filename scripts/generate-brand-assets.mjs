/**
 * Gera favicon, apple-touch e ícones PWA a partir da logomarca oficial.
 * Uso: node scripts/generate-brand-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.resolve(
  process.env.SEGDOC_LOGO_SRC || path.join(root, "brand", "segdoc-logo-source.png"),
);

const publicDir = path.join(root, "public");
const assetsDir = path.join(root, "src", "assets");

const NAVY = { r: 16, g: 42, b: 67, alpha: 1 }; // #102A43
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

async function ensureDirs() {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });
}

/** Remove fundo preto sólido, preservando o emblema. */
async function toTransparentPng(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Fundo preto / quase preto → transparente
    if (r <= 18 && g <= 18 && b <= 18) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function writePng(filePath, buffer) {
  await fs.promises.writeFile(filePath, buffer);
  console.log("wrote", path.relative(root, filePath));
}

async function squareContain(input, size, background) {
  return sharp(input)
    .resize(size, size, {
      fit: "contain",
      background,
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
}

async function maskable(input, size, background, padRatio = 0.18) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const emblem = await sharp(input)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: emblem, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(source)) {
    throw new Error(`Logo fonte não encontrada: ${source}`);
  }
  await ensureDirs();

  const original = await fs.promises.readFile(source);
  const transparent = await toTransparentPng(original);

  // Arte-fonte no app (UI)
  await writePng(path.join(assetsDir, "segdoc-logo.png"), transparent);
  await writePng(path.join(publicDir, "segdoc-logo.png"), transparent);
  // Mantém cópia com fundo preto para usos que precisem do original
  await writePng(path.join(publicDir, "segdoc-logo-solid.png"), await squareContain(original, 1024, BLACK));

  // Favicon / apple
  const fav32 = await squareContain(transparent, 32, { r: 0, g: 0, b: 0, alpha: 0 });
  const fav48 = await squareContain(transparent, 48, { r: 0, g: 0, b: 0, alpha: 0 });
  const fav64 = await squareContain(transparent, 64, { r: 0, g: 0, b: 0, alpha: 0 });
  const fav180 = await squareContain(transparent, 180, { r: 0, g: 0, b: 0, alpha: 0 });
  const fav192 = await squareContain(transparent, 192, { r: 0, g: 0, b: 0, alpha: 0 });

  await writePng(path.join(publicDir, "favicon.png"), fav192);
  await writePng(path.join(publicDir, "apple-touch-icon.png"), fav180);

  const ico = await pngToIco([fav32, fav48, fav64]);
  await fs.promises.writeFile(path.join(publicDir, "favicon.ico"), ico);
  console.log("wrote public/favicon.ico");

  // PWA
  const pwa192 = await squareContain(transparent, 192, { r: 0, g: 0, b: 0, alpha: 0 });
  const pwa512 = await squareContain(transparent, 512, { r: 0, g: 0, b: 0, alpha: 0 });
  // any: fundo preto (como a arte original) para contraste em launchers
  const pwa192Solid = await squareContain(original, 192, BLACK);
  const pwa512Solid = await squareContain(original, 512, BLACK);
  const maskable512 = await maskable(transparent, 512, NAVY, 0.2);

  await writePng(path.join(publicDir, "pwa-192x192.png"), pwa192Solid);
  await writePng(path.join(publicDir, "pwa-512x512.png"), pwa512Solid);
  await writePng(path.join(publicDir, "pwa-maskable-512x512.png"), maskable512);
  // OG / social
  await writePng(path.join(publicDir, "og-image.png"), pwa512Solid);

  // variantes transparentes extras (opcional UI)
  await writePng(path.join(publicDir, "pwa-192x192-transparent.png"), pwa192);
  await writePng(path.join(publicDir, "pwa-512x512-transparent.png"), pwa512);

  console.log("Brand assets gerados com sucesso.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
