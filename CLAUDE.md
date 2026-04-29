# CLAUDE.md

Project rules.

- Vanilla HTML, modern CSS, ES-module JavaScript. No client-side framework,
  no transpilation, no third-party origins at runtime.
- Build with Eleventy. Source under `content/`, layouts under `layouts/`,
  styles in `styles/`, optional progressive-enhancement modules in
  `scripts/`.
- Quality gate (`npm test`): ESLint, Stylelint, Eleventy build,
  html-validate, axe-core, Lighthouse CI ≥ 95 mobile for accessibility,
  best-practices, and SEO; performance ≥ 90; link-checker, `node:test`
  ≥ 80% line coverage on JS modules with branching logic.
- Per-page budgets: CSS ≤ 20 KB gzipped, JS ≤ 30 KB gzipped, webfont weight
  ≤ 200 KB on first visit, hero image ≤ 100 KB, LCP ≤ 2 s on Slow-4G
  mobile.
- Light-only colour scheme; cream paper, sage accents.
- Body font: Google Sans Flex (self-hosted variable). Heading font:
  Rosarivo (self-hosted). System fallbacks in every stack.
- British English in user-facing copy. No em dashes. JavaScript is a
  progressive enhancement; the site MUST be fully usable with JS disabled.
- Once a post URL ships, it never moves. Renames or deletions become
  redirect rules in `_redirects`.
