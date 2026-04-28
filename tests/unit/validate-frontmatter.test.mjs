import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  validateOne,
  validateAll,
} from "../../scripts/build/validate-frontmatter.mjs";

const valid = (overrides = {}) => {
  const { frontmatter: fmOverrides = {}, ...rest } = overrides;
  return {
    inputPath: "content/writing/hello/index.md",
    slug: "hello",
    ...rest,
    frontmatter: {
      title: "Hello",
      description: "Greetings.",
      date: "2026-04-28",
      ...fmOverrides,
    },
  };
};

describe("validateOne: Post", () => {
  it("accepts a fully valid post", () => {
    const errors = validateOne(valid(), { kind: "post", today: "2026-04-28" });
    assert.deepEqual(errors, []);
  });

  it("rejects a post missing title", () => {
    const errors = validateOne(
      valid({ frontmatter: { title: undefined } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /title.*required/i);
  });

  it("rejects a post missing description", () => {
    const errors = validateOne(
      valid({ frontmatter: { description: undefined } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /description.*required/i);
  });

  it("rejects a post missing date", () => {
    const errors = validateOne(
      valid({ frontmatter: { date: undefined } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /date.*required/i);
  });

  it("rejects a description over 200 chars", () => {
    const long = "x".repeat(201);
    const errors = validateOne(
      valid({ frontmatter: { description: long } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /description.*200/);
  });

  it("rejects a malformed date", () => {
    const errors = validateOne(
      valid({ frontmatter: { date: "not-a-date" } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /date/i);
  });

  it("rejects a future-dated published post", () => {
    const errors = validateOne(
      valid({ frontmatter: { date: "2099-01-01", draft: false } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /future/i);
  });

  it("permits a future-dated draft post", () => {
    const errors = validateOne(
      valid({ frontmatter: { date: "2099-01-01", draft: true } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.deepEqual(errors, []);
  });

  it("rejects updated earlier than date", () => {
    const errors = validateOne(
      valid({ frontmatter: { date: "2026-04-28", updated: "2026-04-01" } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /updated/i);
  });

  it("rejects an invalid slug", () => {
    const errors = validateOne(
      { ...valid(), slug: "Bad Slug!" },
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /slug/i);
  });

  it("rejects a cover with empty alt", () => {
    const errors = validateOne(
      valid({ frontmatter: { cover: { src: "x.png", alt: "" } } }),
      { kind: "post", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /cover.*alt/i);
  });
});

describe("validateOne: Page", () => {
  it("accepts a valid page", () => {
    const errors = validateOne(
      {
        inputPath: "content/about.md",
        slug: "about",
        frontmatter: {
          title: "About",
          description: "Who I am.",
          layout: "base.njk",
          eleventyExcludeFromCollections: true,
        },
      },
      { kind: "page", today: "2026-04-28" },
    );
    assert.deepEqual(errors, []);
  });

  it("rejects a page that does not exclude from collections", () => {
    const errors = validateOne(
      {
        inputPath: "content/about.md",
        slug: "about",
        frontmatter: {
          title: "About",
          description: "Who I am.",
          layout: "base.njk",
          eleventyExcludeFromCollections: false,
        },
      },
      { kind: "page", today: "2026-04-28" },
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /eleventyExcludeFromCollections/);
  });
});

describe("validateAll: slug uniqueness", () => {
  it("rejects two posts with the same slug", () => {
    const items = [
      valid({ inputPath: "content/writing/hello/index.md", slug: "hello" }),
      valid({ inputPath: "content/writing/hello-2/index.md", slug: "hello" }),
    ];
    const errors = validateAll(items, { today: "2026-04-28" });
    assert.ok(errors.some((e) => /slug.*collision/i.test(e)));
  });
});
