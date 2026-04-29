#!/usr/bin/env node
/**
 * Wrapper around @axe-core/cli that converts every emitted HTML file in
 * _site/ to a file:// URL before invoking axe.
 *
 * axe-cli passes its arguments straight to the browser driver, which
 * interprets bare paths as hostnames (so `_site/about/index.html` becomes
 * `http://_site/about/index.html` and fails ERR_NAME_NOT_RESOLVED). By
 * resolving each path to a file:// URL up front, axe loads the document
 * locally without any network resolution.
 */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

function findHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) findHtml(path, out);
    else if (entry.isFile() && path.endsWith(".html")) out.push(path);
  }
  return out;
}

const root = resolve("_site");
const urls = findHtml(root).map((p) => pathToFileURL(p).href);

if (urls.length === 0) {
  process.stderr.write("run-axe: no HTML files found in _site/\n");
  process.exit(1);
}

const result = spawnSync("npx", ["--no-install", "axe", ...urls], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
