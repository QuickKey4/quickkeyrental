import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = path.resolve(".");
const publicDir = path.join(root, "public");
const logoPath = path.join(root, "src/assets/logo-quick-key-rental.png");

const BRAND_RED = "#e8282e";
const SITE_NAME = "QuickKey Rental Curaçao";
const TAGLINE = "Affordable & reliable car rentals in Curaçao";

async function squareIcon(size, outName) {
  const logo = sharp(logoPath).resize(Math.round(size * 0.82), null, { fit: "inside" });
  const logoBuffer = await logo.png().toBuffer();
  const meta = await sharp(logoBuffer).metadata();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: logoBuffer,
        left: Math.round((size - meta.width) / 2),
        top: Math.round((size - meta.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(publicDir, outName));
}

async function createOgImage() {
  const width = 1200;
  const height = 630;
  const logoWidth = 720;
  const logoBuffer = await sharp(logoPath).resize(logoWidth, null, { fit: "inside" }).png().toBuffer();
  const logoMeta = await sharp(logoBuffer).metadata();

  const titleSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${BRAND_RED}"/>
      <text x="50%" y="${height - 88}" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600">${TAGLINE.replace(/&/g, "&amp;")}</text>
      <text x="50%" y="${height - 42}" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="24" opacity="0.92">Airport · Hotel · Local pickup</text>
    </svg>
  `);

  await sharp(titleSvg)
    .composite([
      {
        input: logoBuffer,
        left: Math.round((width - logoMeta.width) / 2),
        top: Math.round((height - logoMeta.height) / 2 - 36),
      },
    ])
    .jpeg({ quality: 88 })
    .toFile(path.join(publicDir, "og-image.jpg"));
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  await squareIcon(16, "favicon-16x16.png");
  await squareIcon(32, "favicon-32x32.png");
  await squareIcon(180, "apple-touch-icon.png");
  await squareIcon(192, "android-chrome-192x192.png");
  await squareIcon(512, "android-chrome-512x512.png");
  await createOgImage();

  const ico = await pngToIco([
    path.join(publicDir, "favicon-16x16.png"),
    path.join(publicDir, "favicon-32x32.png"),
  ]);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);

  const manifest = {
    name: SITE_NAME,
    short_name: "QuickKey",
    description:
      "Affordable and reliable car rentals in Curaçao. Airport delivery, hotel delivery, and local pickup available.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND_RED,
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  await writeFile(
    path.join(publicDir, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log("Brand assets generated in public/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
