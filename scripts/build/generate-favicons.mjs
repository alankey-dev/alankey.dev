#!/usr/bin/env node
/**
 * Generate raster favicon variants from assets/favicon.svg using sharp.
 * Outputs:
 *   assets/favicon-16.png
 *   assets/favicon-32.png
 *   assets/apple-touch-icon.png (180x180)
 *
 * Run as a prebuild step from `npm run build`.
 */

import { readFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");
const src = join(root, "assets", "favicon.svg");
const outDir = join(root, "assets");

mkdirSync(outDir, { recursive: true });

const variants = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
];

const svg = readFileSync(src);

const tasks = variants.map(async ({ name, size }) => {
  const out = join(outDir, name);
  // Only regenerate if missing or older than the source.
  let needs;
  try {
    const srcMtime = statSync(src).mtimeMs;
    const outMtime = statSync(out).mtimeMs;
    needs = outMtime < srcMtime;
  } catch {
    needs = true;
  }
  if (!needs) return;
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  process.stdout.write(`favicon: wrote ${name}\n`);
});

await Promise.all(tasks);
