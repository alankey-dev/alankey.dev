# alankey.dev

Personal site for Alan Gardner. Plain semantic HTML, modern CSS, vanilla
JavaScript. No client-side framework, no transpilation, no tracking. Built
with Eleventy at publish time and deployed from `main` to a static edge
host.

## Live

<https://alankey.dev/>

## Stack

- HTML5, CSS (cascade layers, no preprocessors), JavaScript ES2022 via
  native modules.
- Eleventy 3 build, Markdown content, Shiki syntax highlighting at build
  time, Atom feed, AVIF/WebP image pipeline.
- Self-hosted webfonts: Google Sans Flex (body), Rosarivo (headings).
- Light-only colour scheme with WCAG 2.2 AA contrast.

## Getting started

```sh
git clone https://github.com/alankey-dev/alankey.dev.git
cd alankey.dev
npm ci
npm run dev      # http://localhost:8080 with hot reload
```

## Authoring a post

Posts live under `content/writing/<slug>/index.md`. Frontmatter:

```yaml
---
title: "Why I rebuilt my site by hand"
description: "A short note on choosing simplicity over a framework."
date: 2026-04-28
draft: false
---
```

Drafts (`draft: true`) are excluded from the build, the writing list, the
feed, and the sitemap. Once published, a post's URL is permanent: don't
rename, don't delete; if you absolutely must, add a redirect rule in
`_redirects`.

Co-locate post images under `content/writing/<slug>/images/` and reference
them with the `{% image "./images/foo.png", "alt text" %}` shortcode. The
image plugin emits AVIF + WebP + JPEG with intrinsic dimensions baked in.

## Quality gate

`npm test` runs, in order, exiting at the first failure:

| Step | What |
|--|--|
| `lint` | ESLint and Stylelint, zero warnings |
| `build` | Eleventy production build with strict frontmatter validation |
| `test:html` | html-validate over every emitted HTML file |
| `test:a11y` | axe-core over every page; zero violations required |
| `test:perf` | Lighthouse CI mobile preset; ≥ 95 across Performance, Accessibility, Best Practices, and SEO on every page; LCP ≤ 1.5 s; CLS ≤ 0.05 |
| `test:links` | Internal-link integrity |
| `test:unit` | `node:test` with ≥ 80% line coverage on JS modules with branching logic |

Any failure is a merge blocker. CI runs the full gate on push and PR via
`.github/workflows/ci.yml`.

## Per-page budgets

| Asset | Cap | Headroom on v1 |
|--|--|--|
| CSS gzipped | 20 KB | ~3.6 KB used |
| JS gzipped | 30 KB | 0 KB on most pages, ~0.8 KB on post pages |
| Webfonts (first visit) | 200 KB | 135 KB used |
| Hero image | 100 KB | n/a (not used yet) |

## Deploy

The repo deploys from `main` to a static edge host. Build command:
`npm run build`. Output directory: `_site`. Set
`BASE_URL=https://alankey.dev` in the host's environment.

## Project rules

See `CLAUDE.md` for the headline rules. The full quality bar is encoded in
the configs themselves: `.lighthouserc.json` for performance and a11y
thresholds, `.htmlvalidate.json` for HTML conformance, `eslint.config.js`
and `.stylelintrc.json` for code style, and `.github/workflows/ci.yml` for
the merge gate.
