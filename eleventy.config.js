import { readdirSync, readFileSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItFootnote from "markdown-it-footnote";
import { codeToHtml } from "shiki";

import EleventyImg from "@11ty/eleventy-img";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import bundlePlugin from "@11ty/eleventy-plugin-bundle";

import { validateAll } from "./scripts/build/validate-frontmatter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.ELEVENTY_ENV === "production";

/** Build a markdown-it instance with our extensions and Shiki highlighting. */
async function buildMarkdown() {
  // Pre-warm Shiki by loading the two themes once.
  // Shiki is async; we resolve all highlighting requests through codeToHtml
  // which the `highlight` hook calls with a Promise. markdown-it itself is
  // synchronous, so we render code blocks through a placeholder and post-
  // process the output. To keep the pipeline simple, we use a synchronous
  // wrapper that blocks on the first call to warm caches.
  const md = markdownIt({
    html: false,
    linkify: true,
    typographer: false,
  });
  md.use(markdownItAnchor, { permalink: false, slugify: (s) => slugify(s) });
  md.use(markdownItFootnote);

  // Replace the default fence renderer with a Shiki-based one. Shiki is
  // async, so we return an async-safe placeholder and resolve all fences
  // before the page is written. To stay in markdown-it's synchronous
  // contract, we run Shiki synchronously by awaiting a queued promise via
  // a small dual-render trick: collect fences during render, then replace
  // them after.
  const placeholders = new Map();
  let placeholderId = 0;

  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    const lang = (token.info || "").trim().split(/\s+/)[0] || "text";
    const code = token.content;
    const id = `__SHIKI_PLACEHOLDER_${placeholderId++}__`;
    placeholders.set(id, { code, lang });
    return `<pre data-shiki="${id}"><code>${escapeHtml(code)}</code></pre>\n`;
  };

  md.resolveFences = async (html) => {
    if (placeholders.size === 0) return html;
    let out = html;
    for (const [id, { code, lang }] of placeholders) {
      try {
        const highlighted = await codeToHtml(code, {
          lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        });
        out = out.replace(
          new RegExp(`<pre data-shiki="${id}"><code>[\\s\\S]*?</code></pre>`),
          highlighted,
        );
      } catch {
        // Unknown language: leave the escaped fallback in place.
        out = out.replace(` data-shiki="${id}"`, "");
      }
    }
    placeholders.clear();
    return out;
  };

  return md;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export default async function (eleventyConfig) {
  // ----- Markdown -----------------------------------------------------------
  const md = await buildMarkdown();
  eleventyConfig.setLibrary("md", md);

  // Hook to resolve Shiki fences after markdown rendering.
  eleventyConfig.addTransform("shiki-fences", async function (content) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) {
      return content;
    }
    return md.resolveFences(content);
  });

  // ----- Image shortcode (AVIF + WebP + JPEG fallback) ----------------------
  eleventyConfig.addAsyncShortcode(
    "image",
    async function (src, alt, sizes = "100vw", eager = false) {
      if (typeof alt !== "string" || alt.length === 0) {
        throw new Error(
          `image shortcode missing alt text for src="${src}" on ${this.page?.inputPath ?? "unknown"}`,
        );
      }
      const inputPath = this.page?.inputPath
        ? join(__dirname, dirname(this.page.inputPath), src)
        : src;
      const metadata = await EleventyImg(inputPath, {
        widths: [480, 960, 1440, "auto"],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "_site/assets/img/",
        urlPath: "/assets/img/",
        sharpJpegOptions: { quality: 82, mozjpeg: true },
        sharpAvifOptions: { quality: 60 },
        sharpWebpOptions: { quality: 80 },
      });
      const imageAttributes = {
        alt,
        sizes,
        loading: eager ? "eager" : "lazy",
        decoding: "async",
        fetchpriority: eager ? "high" : "auto",
      };
      return EleventyImg.generateHTML(metadata, imageAttributes);
    },
  );

  // ----- Atom feed plugin ---------------------------------------------------
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "posts", limit: 50 },
    metadata: {
      language: "en-GB",
      title: "alankey",
      subtitle: "Alan Gardner.",
      base: process.env.BASE_URL || "https://alankey.dev",
      author: { name: "Alan Gardner" },
    },
  });

  // ----- CSS bundle plugin --------------------------------------------------
  eleventyConfig.addPlugin(bundlePlugin);

  // ----- inlineCSS shortcode ------------------------------------------------
  // Reads files from styles/ at build time and inlines them. Used by
  // base.njk to compose the per-page stylesheet from the layered files.
  // In production we cache + minify; in development we re-read every time
  // so hot-reload always sees the latest source.
  const cssCache = new Map();
  eleventyConfig.addShortcode("inlineCSS", (...names) => {
    let out = "";
    for (const name of names) {
      const path = join(__dirname, "styles", name);
      let css;
      if (isProduction) {
        css = cssCache.get(path);
        if (css === undefined) {
          css = readFileSync(path, "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\s+/g, " ")
            .replace(/\s*([{}:;,])\s*/g, "$1")
            .trim();
          cssCache.set(path, css);
        }
      } else {
        css = readFileSync(path, "utf8");
      }
      out += css + "\n";
    }
    return out;
  });

  // Watch styles/ so dev-mode rebuilds pick up CSS changes.
  eleventyConfig.addWatchTarget("./styles/");

  // ----- Passthrough copy ---------------------------------------------------
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });
  // Ship only the runtime ES module under scripts/. Build helpers under
  // scripts/build/ are dev-only and must not be exposed to visitors.
  eleventyConfig.addPassthroughCopy({ "scripts/code-copy.mjs": "scripts/code-copy.mjs" });
  eleventyConfig.addPassthroughCopy({ "scripts/theme-toggle.mjs": "scripts/theme-toggle.mjs" });
  eleventyConfig.addPassthroughCopy({ "_redirects": "_redirects" });

  // ----- Filters ------------------------------------------------------------
  eleventyConfig.addFilter("isoDate", (date) => {
    return new Date(date).toISOString().slice(0, 10);
  });
  eleventyConfig.addFilter("readableDate", (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  });
  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    const b = (base || process.env.BASE_URL || "https://alankey.dev").replace(
      /\/$/,
      "",
    );
    return `${b}${path}`;
  });

  // ----- Collections --------------------------------------------------------
  eleventyConfig.addCollection("posts", (api) => {
    const now = Date.now();
    return api
      .getFilteredByGlob("content/blog/**/*.md")
      .filter((item) => !item.inputPath.endsWith("blog/index.md"))
      .filter((item) => !item.data.draft)
      .filter((item) => !isProduction || new Date(item.data.date).getTime() <= now)
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
  });

  eleventyConfig.addCollection("latestPosts", (api) => {
    const now = Date.now();
    return api
      .getFilteredByGlob("content/blog/**/*.md")
      .filter((item) => !item.inputPath.endsWith("blog/index.md"))
      .filter((item) => !item.data.draft)
      .filter((item) => !isProduction || new Date(item.data.date).getTime() <= now)
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
      .slice(0, 3);
  });

  // ----- Frontmatter validation gate (production only) ----------------------
  eleventyConfig.on("eleventy.before", async ({ runMode }) => {
    if (!isProduction) return;
    const items = collectMarkdownFiles(join(__dirname, "content"));
    const errors = validateAll(items);
    if (errors.length > 0) {
      const msg = errors.map((e) => `  - ${e}`).join("\n");
      throw new Error(`Frontmatter validation failed:\n${msg}`);
    }
    if (runMode) {
      // touch to keep linter happy
    }
  });

  // ----- Eleventy paths -----------------------------------------------------
  return {
    dir: {
      input: "content",
      output: "_site",
      includes: "../layouts",
      layouts: "../layouts",
      data: "../_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}

/** Walk content/ and return [{ inputPath, frontmatter, body }] for every .md file. */
function collectMarkdownFiles(root) {
  const out = [];
  const seen = new Set();

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.endsWith(".md")) {
        const raw = readFileSync(full, "utf8");
        const { frontmatter, body } = parseFrontmatter(raw);
        const slug = basename(dirname(full)) === "blog" ? null : basename(dirname(full));
        out.push({
          inputPath: full,
          slug: slug || basename(full, ".md"),
          frontmatter,
          body,
          seenSlugs: seen,
        });
      }
    }
  }
  walk(root);
  return out;
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw };
  }
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return { frontmatter: {}, body: raw };
  const yaml = raw.slice(4, end);
  const body = raw.slice(end + 5);
  // Tiny YAML subset parser: scalar key/value, ISO dates, booleans, lists,
  // nested objects to one level. Sufficient for our frontmatter schema.
  const fm = parseTinyYaml(yaml);
  return { frontmatter: fm, body };
}

function parseTinyYaml(yaml) {
  const out = {};
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i++;
      continue;
    }
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const [, key, rest] = m;
    if (rest === "") {
      // Either nested map or list
      const nested = {};
      const list = [];
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) {
        const child = lines[i].replace(/^\s+/, "");
        if (child.startsWith("- ")) {
          list.push(coerce(child.slice(2).trim()));
        } else {
          const cm = child.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
          if (cm) nested[cm[1]] = coerce(cm[2]);
        }
        i++;
      }
      out[key] = list.length > 0 ? list : nested;
    } else {
      out[key] = coerce(rest);
      i++;
    }
  }
  return out;
}

function coerce(v) {
  const trimmed = v.trim();
  if (/^"(.*)"$/.test(trimmed)) return trimmed.slice(1, -1);
  if (/^'(.*)'$/.test(trimmed)) return trimmed.slice(1, -1);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return trimmed;
}
