/**
 * Build-time frontmatter validator.
 *
 * Pure functions: take parsed frontmatter (already YAML-parsed into a JS
 * object) plus a context, return an array of human-readable error strings.
 * Empty array means valid.
 *
 * Contract: specs/001-personal-website/contracts/post-frontmatter.md.
 */

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DESCRIPTION = 200;
const MAX_TITLE = 120;

/**
 * Validate a single content item.
 * @param {{ inputPath: string, slug: string, frontmatter: object }} item
 * @param {{ kind?: "post"|"page", today?: string }} ctx
 * @returns {string[]} list of error messages
 */
export function validateOne(item, ctx = {}) {
  const errors = [];
  const fm = item.frontmatter || {};
  const where = item.inputPath || "(unknown file)";
  const today = ctx.today || new Date().toISOString().slice(0, 10);
  const kind = ctx.kind || inferKind(item);

  if (kind === "page") {
    if (fm.eleventyExcludeFromCollections !== true) {
      errors.push(
        `${where}: pages MUST set eleventyExcludeFromCollections: true.`,
      );
    }
    if (!nonEmptyString(fm.title)) {
      errors.push(`${where}: title is required and must be a non-empty string.`);
    }
    if (!nonEmptyString(fm.description)) {
      errors.push(
        `${where}: description is required and must be a non-empty string.`,
      );
    }
    if (!nonEmptyString(fm.layout)) {
      errors.push(`${where}: layout is required and must be a non-empty string.`);
    }
    return errors;
  }

  // Post validation
  if (!nonEmptyString(fm.title)) {
    errors.push(`${where}: title is required and must be a non-empty string.`);
  } else if (fm.title.length > MAX_TITLE) {
    errors.push(`${where}: title must be ≤ ${MAX_TITLE} characters.`);
  }

  if (!nonEmptyString(fm.description)) {
    errors.push(
      `${where}: description is required and must be a non-empty string.`,
    );
  } else if (fm.description.length > MAX_DESCRIPTION) {
    errors.push(
      `${where}: description must be ≤ ${MAX_DESCRIPTION} characters.`,
    );
  }

  if (!fm.date) {
    errors.push(`${where}: date is required (ISO YYYY-MM-DD).`);
  } else if (!isValidIsoDate(fm.date)) {
    errors.push(`${where}: date must be a valid ISO date (YYYY-MM-DD).`);
  } else if (fm.draft !== true && fm.date > today) {
    errors.push(
      `${where}: published post date is in the future (${fm.date} > ${today}).`,
    );
  }

  if (fm.updated !== undefined) {
    if (!isValidIsoDate(fm.updated)) {
      errors.push(`${where}: updated must be a valid ISO date.`);
    } else if (fm.date && isValidIsoDate(fm.date) && fm.updated < fm.date) {
      errors.push(`${where}: updated must be on or after date.`);
    }
  }

  if (item.slug !== undefined && item.slug !== null) {
    if (!SLUG_RE.test(item.slug)) {
      errors.push(
        `${where}: slug "${item.slug}" must match ${SLUG_RE.source}.`,
      );
    }
  }

  if (fm.cover !== undefined) {
    if (typeof fm.cover !== "object" || fm.cover === null) {
      errors.push(`${where}: cover must be an object.`);
    } else if (!nonEmptyString(fm.cover.alt)) {
      errors.push(`${where}: cover.alt is required when cover is present.`);
    }
  }

  return errors;
}

/**
 * Validate a list of items and detect cross-file issues (slug collisions).
 * @param {Array<{ inputPath, slug, frontmatter }>} items
 * @param {{ today?: string }} ctx
 * @returns {string[]}
 */
export function validateAll(items, ctx = {}) {
  const errors = [];
  const slugMap = new Map();

  for (const item of items) {
    const kind = inferKind(item);
    errors.push(...validateOne(item, { ...ctx, kind }));
    if (kind === "post" && item.slug) {
      const prev = slugMap.get(item.slug);
      if (prev) {
        errors.push(
          `slug collision: "${item.slug}" used by both ${prev} and ${item.inputPath}.`,
        );
      } else {
        slugMap.set(item.slug, item.inputPath);
      }
    }
  }
  return errors;
}

function inferKind(item) {
  // Posts live under content/writing/<slug>/index.md
  // Pages live elsewhere (content/index.md, content/about.md, content/404.md)
  if (typeof item.inputPath === "string") {
    if (
      item.inputPath.includes("/writing/") &&
      !item.inputPath.endsWith("/writing/index.md")
    ) {
      return "post";
    }
  }
  return "page";
}

function nonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidIsoDate(s) {
  if (typeof s !== "string" || !ISO_DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
