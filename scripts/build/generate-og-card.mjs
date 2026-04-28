#!/usr/bin/env node
/**
 * Generate the default Open Graph social card (1200x630) from the brand
 * tokens. Composes a dark background, the site name in monospace, and a
 * yellow accent stripe, all using sharp's text rasteriser.
 *
 * Run as a prebuild step from `npm run build`.
 */

import { mkdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "..");
const outDir = join(root, "assets");
const out = join(outDir, "og-default.png");
const tokensPath = join(root, "styles", "tokens.css");

mkdirSync(outDir, { recursive: true });

// Skip work if the card is already up to date.
try {
  const srcMtime = Math.max(
    statSync(tokensPath).mtimeMs,
    statSync(import.meta.url ? fileURLToPath(import.meta.url) : __dirname)
      .mtimeMs,
  );
  const outMtime = statSync(out).mtimeMs;
  if (outMtime > srcMtime) {
    process.stdout.write("og-card: up to date\n");
    process.exit(0);
  }
} catch {
  // Source missing or output missing: fall through and rebuild.
}

const W = 1200;
const H = 630;
const bg = "#101012";
const accent = "#88A57E";
const ink = "#E8E8E8";
const inkMuted = "#B0B0B0";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="0" y="0" width="14" height="${H}" fill="${accent}"/>
  <g font-family="ui-monospace, 'SF Mono', Menlo, monospace" fill="${ink}">
    <text x="80" y="280" font-size="96" font-weight="700">alankey</text>
    <text x="80" y="360" font-size="40" font-weight="400" fill="${inkMuted}">Alan Gardner writes here.</text>
  </g>
  <g font-family="ui-monospace, 'SF Mono', Menlo, monospace" fill="${accent}">
    <text x="80" y="540" font-size="28" font-weight="700" letter-spacing="2">PERSONAL · WRITING · NOTES</text>
  </g>
</svg>
`.trim();

await sharp(Buffer.from(svg)).png().toFile(out);
process.stdout.write(`og-card: wrote ${out}\n`);

// `readFileSync` retained for future use if we want to embed token values.
void readFileSync;
