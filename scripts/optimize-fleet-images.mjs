import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assetsDir = path.resolve("src/assets");
const outDir = path.join(assetsDir, "optimized");

const jobs = [
  { input: "fleet-agya-coast.png", output: "fleet-agya-coast.webp", width: 1920, quality: 78 },
  { input: "fleet-agya-coast.png", output: "fleet-agya-coast-thumb.webp", width: 720, quality: 72 },
  { input: "fleet-agya-front.png", output: "fleet-agya-front.webp", width: 1280, quality: 78 },
  { input: "fleet-yaris-front.png", output: "fleet-yaris-front.webp", width: 1280, quality: 78 },
  { input: "fleet-yaris-front.png", output: "fleet-yaris-front-thumb.webp", width: 720, quality: 72 },
  { input: "fleet-yaris-street.png", output: "fleet-yaris-street.webp", width: 1280, quality: 78 },
  { input: "fleet-yaris-street.png", output: "fleet-yaris-street-thumb.webp", width: 720, quality: 72 },
  { input: "fleet-yaris-showroom.png", output: "fleet-yaris-showroom.webp", width: 1280, quality: 78 },
  { input: "fleet-yaris-airport-cur.png", output: "fleet-yaris-airport-cur.webp", width: 1280, quality: 78 },
  {
    input: "fleet-yaris-airport-cur.png",
    output: "fleet-yaris-airport-cur-thumb.webp",
    width: 720,
    quality: 72,
  },
  { input: "fleet-agya-villa.png", output: "fleet-agya-villa.webp", width: 1280, quality: 78 },
  { input: "fleet-agya-villa.png", output: "fleet-agya-villa-thumb.webp", width: 720, quality: 72 },
  {
    input: "fleet-agya-curacao-sign.png",
    output: "fleet-agya-curacao-sign.webp",
    width: 1280,
    quality: 78,
    extractHeightRatio: 0.72,
  },
  {
    input: "fleet-agya-curacao-sign.png",
    output: "fleet-agya-curacao-sign-thumb.webp",
    width: 720,
    quality: 72,
    extractHeightRatio: 0.72,
  },
  { input: "fleet-agya-airport-cur.png", output: "fleet-agya-airport-cur.webp", width: 1280, quality: 78 },
  {
    input: "fleet-agya-airport-cur.png",
    output: "fleet-agya-airport-cur-thumb.webp",
    width: 720,
    quality: 72,
  },
  { input: "moment-beach-mambo.png", output: "moment-beach-mambo.webp", width: 1280, quality: 80 },
  { input: "moment-willemstad.png", output: "moment-willemstad.webp", width: 1280, quality: 80 },
  { input: "moment-coastline.png", output: "moment-coastline.webp", width: 1280, quality: 80 },
  { input: "destination-westpunt.png", output: "destination-westpunt.webp", width: 1280, quality: 80 },
  { input: "destination-westpunt.png", output: "destination-westpunt-thumb.webp", width: 720, quality: 72 },
  { input: "destination-jan-thiel.png", output: "destination-jan-thiel.webp", width: 1280, quality: 80 },
  { input: "destination-jan-thiel.png", output: "destination-jan-thiel-thumb.webp", width: 720, quality: 72 },
  { input: "destination-willemstad.png", output: "destination-willemstad.webp", width: 1280, quality: 80 },
  { input: "destination-willemstad.png", output: "destination-willemstad-thumb.webp", width: 720, quality: 72 },
  { input: "curacao-satellite-map.png", output: "curacao-satellite-map.webp", width: 1536, quality: 82 },
  { input: "curacao-satellite-map.png", output: "curacao-satellite-map-thumb.webp", width: 720, quality: 78 },
  {
    input: "optimized/hero-curacao-agya-panorama.png",
    output: "hero-curacao-agya-panorama-640w.webp",
    width: 640,
    quality: 82,
    withoutEnlargement: true,
  },
  {
    input: "optimized/hero-curacao-agya-panorama.png",
    output: "hero-curacao-agya-panorama-1024w.webp",
    width: 1024,
    quality: 85,
    withoutEnlargement: true,
  },
  {
    input: "optimized/hero-curacao-agya-panorama.png",
    output: "hero-curacao-agya-panorama-1536w.webp",
    width: 1536,
    quality: 85,
    withoutEnlargement: true,
  },
  {
    input: "optimized/hero-curacao-agya-panorama.png",
    output: "hero-curacao-agya-panorama-2048w.webp",
    width: 2048,
    quality: 88,
    withoutEnlargement: true,
  },
  {
    input: "optimized/hero-curacao-agya-panorama.png",
    output: "hero-curacao-agya-panorama-2560w.webp",
    width: 2560,
    quality: 88,
    withoutEnlargement: true,
  },
];

await mkdir(outDir, { recursive: true });

for (const job of jobs) {
  const inputPath = path.join(assetsDir, job.input);
  const outputPath = path.join(outDir, job.output);
  let pipeline = sharp(inputPath).rotate();

  if (job.extractHeightRatio && job.extractHeightRatio < 1) {
    const { width, height } = await pipeline.clone().metadata();
    const extractHeight = Math.round(height * job.extractHeightRatio);
    pipeline = pipeline.extract({
      left: 0,
      top: 0,
      width,
      height: extractHeight,
    });
  }

  pipeline = pipeline.resize({
    width: job.width,
    withoutEnlargement: job.withoutEnlargement ?? true,
    kernel: sharp.kernel.lanczos3,
  });

  if (job.sharpen) {
    pipeline = pipeline.sharpen({ sigma: job.sharpen });
  }

  const info = await pipeline.webp({ quality: job.quality, effort: 6 }).toFile(outputPath);

  console.log(`${job.output}: ${(info.size / 1024).toFixed(1)} KB`);
}
